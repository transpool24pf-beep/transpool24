import { calculatePriceBreakdown, type PriceBreakdown, type PricingOptions, type ServiceType } from "@/lib/pricing";
import { getRouteDistanceAndDuration, geocodeAddressForMap } from "@/lib/route-distance-server";
import { getLoadUnloadMinutes } from "@/lib/cargo";
import {
  routeDriveTimeMultiplier,
  weightSurchargeCentsFromKg,
  type RouteTerrainId,
  type RouteWeatherId,
} from "@/lib/route-pricing-factors";
import { resolveWeatherForMidpoint, terrainFromGoogleElevation } from "@/lib/auto-route-factors";

export type OrderPricingComputeOk = {
  distanceKm: number;
  durationMinutes: number | null;
  routeTerrain: RouteTerrainId;
  routeWeather: RouteWeatherId;
  routeDriveTimeMultiplier: number;
  terrainSource: "google-elevation" | "none";
  weatherSource: "google-weather" | "open-meteo";
  roundTripMinutes: number;
  loadingMinutes: number;
  unloadingMinutes: number;
  totalDriverMinutes: number;
  weightSurchargeCents: number;
  breakdown: PriceBreakdown;
};

export async function computeOrderPricingFromAddresses(input: {
  pickupAddress: string;
  deliveryAddress: string;
  departureTime: Date | null;
  cargoCategory: string | null;
  weightKg: number;
  cargoSize: "XS" | "M" | "L";
  serviceType: ServiceType;
  pricingOpts: PricingOptions;
  googleMapsApiKey?: string | null;
}): Promise<{ ok: true; data: OrderPricingComputeOk } | { ok: false; error: "ROUTE_FAILED" }> {
  const key = input.googleMapsApiKey ?? process.env.GOOGLE_MAPS_API_KEY ?? null;

  const route = await getRouteDistanceAndDuration(
    input.pickupAddress.trim(),
    input.deliveryAddress.trim(),
    input.departureTime
  );
  if (!route || route.distanceKm <= 0) {
    return { ok: false, error: "ROUTE_FAILED" };
  }

  const { distanceKm, durationMinutes } = route;
  const oneWayBase = durationMinutes ?? Math.round((distanceKm / 50) * 60);
  const weightKg = Math.max(0, Number(input.weightKg) || 0);

  const [from, to] = await Promise.all([
    geocodeAddressForMap(input.pickupAddress.trim()),
    geocodeAddressForMap(input.deliveryAddress.trim()),
  ]);

  let routeTerrain: RouteTerrainId = "flat";
  let terrainSource: "google-elevation" | "none" = "none";
  if (from && to && key) {
    routeTerrain = await terrainFromGoogleElevation(from, to, key);
    terrainSource = "google-elevation";
  }

  const midLat = from && to ? (from.lat + to.lat) / 2 : from?.lat ?? to?.lat ?? 48.8932;
  const midLng = from && to ? (from.lon + to.lon) / 2 : from?.lon ?? to?.lon ?? 8.6919;
  const { weather: routeWeather, source: weatherSource } = await resolveWeatherForMidpoint(
    midLat,
    midLng,
    key ?? undefined
  );

  const driveMult = routeDriveTimeMultiplier(routeTerrain, routeWeather, weightKg);
  const oneWayAdjusted = Math.round(oneWayBase * driveMult);
  const roundTripMinutes = oneWayAdjusted * 2;

  const { loadingMinutes, unloadingMinutes } = getLoadUnloadMinutes(input.cargoCategory, weightKg);
  const totalDriverMinutes = Math.round(roundTripMinutes + loadingMinutes + unloadingMinutes);
  const weightSurchargeCents = weightSurchargeCentsFromKg(weightKg);

  const breakdown = calculatePriceBreakdown(
    distanceKm,
    input.cargoSize,
    durationMinutes ?? null,
    input.pricingOpts,
    input.serviceType,
    totalDriverMinutes,
    weightSurchargeCents
  );

  return {
    ok: true,
    data: {
      distanceKm,
      durationMinutes: durationMinutes ?? null,
      routeTerrain,
      routeWeather,
      routeDriveTimeMultiplier: driveMult,
      terrainSource,
      weatherSource,
      roundTripMinutes,
      loadingMinutes,
      unloadingMinutes,
      totalDriverMinutes,
      weightSurchargeCents,
      breakdown,
    },
  };
}
