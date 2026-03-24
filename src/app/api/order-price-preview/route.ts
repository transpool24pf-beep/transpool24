import { NextResponse } from "next/server";
import { getPricingSettings } from "@/lib/settings";
import { computeOrderPricingFromAddresses } from "@/lib/order-pricing-compute";
import { isCargoCategoryId } from "@/lib/cargo";

const VALID_CARGO = ["XS", "M", "L"] as const;
const VALID_SERVICE = ["driver_only", "driver_car", "driver_car_assistant"] as const;

/**
 * Live step-3 price preview: same logic as confirm-order (auto terrain + weather).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pickupAddress = typeof body.pickupAddress === "string" ? body.pickupAddress.trim() : "";
    const deliveryAddress = typeof body.deliveryAddress === "string" ? body.deliveryAddress.trim() : "";
    const pickupTime =
      body.pickupTime && !Number.isNaN(Date.parse(String(body.pickupTime)))
        ? new Date(String(body.pickupTime))
        : null;
    const cargoSize = body.cargoSize;
    const serviceType = VALID_SERVICE.includes(body.serviceType) ? body.serviceType : "driver_car";
    const weightKg = body.weightKg != null ? Number(body.weightKg) : NaN;
    const cargoCategory =
      body.cargoCategory != null && typeof body.cargoCategory === "string" ? body.cargoCategory : "";

    if (!pickupAddress || !deliveryAddress) {
      return NextResponse.json({ error: "Missing addresses" }, { status: 400 });
    }
    if (!VALID_CARGO.includes(cargoSize)) {
      return NextResponse.json({ error: "Invalid cargo size" }, { status: 400 });
    }
    if (!isCargoCategoryId(cargoCategory)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      return NextResponse.json({ error: "Invalid weight" }, { status: 400 });
    }

    const pricing = await getPricingSettings();
    const pricingOpts = {
      price_per_km_cents: pricing.price_per_km_cents,
      driver_hourly_rate_cents: pricing.driver_hourly_rate_cents,
      driver_only_hourly_cents: pricing.driver_only_hourly_cents,
      assistant_fee_cents: pricing.assistant_fee_cents,
      weight_surcharge_cents_per_10kg: pricing.weight_surcharge_cents_per_10kg,
      cargo_category_adjustment_cents: pricing.cargo_category_adjustment_cents,
    };

    const result = await computeOrderPricingFromAddresses({
      pickupAddress,
      deliveryAddress,
      departureTime: pickupTime,
      weightKg,
      cargoCategory: cargoCategory || null,
      cargoSize,
      serviceType,
      pricingOpts,
    });

    if (!result.ok) {
      return NextResponse.json({ error: "ROUTE_FAILED" }, { status: 400 });
    }

    const d = result.data;
    return NextResponse.json({
      distanceKm: d.distanceKm,
      durationMinutes: d.durationMinutes,
      routeTerrain: d.routeTerrain,
      routeWeather: d.routeWeather,
      routeDriveTimeMultiplier: d.routeDriveTimeMultiplier,
      terrainSource: d.terrainSource,
      weatherSource: d.weatherSource,
      roundTripMinutes: d.roundTripMinutes,
      loadingMinutes: d.loadingMinutes,
      unloadingMinutes: d.unloadingMinutes,
      totalDriverMinutes: d.totalDriverMinutes,
      breakdown: d.breakdown,
    });
  } catch (e) {
    console.error("[order-price-preview]", e);
    return NextResponse.json({ error: "Preview failed" }, { status: 500 });
  }
}
