import { geocodeGermanyOne } from "./nominatim-germany";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";
const GOOGLE_DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json";

/** Nominatim (server-only). PLZ + free-text Germany; respect OSM usage policy. */
export async function geocodeAddressForMap(address: string): Promise<{ lat: number; lon: number } | null> {
  const hit = await geocodeGermanyOne(address);
  if (!hit || !Number.isFinite(hit.lat) || !Number.isFinite(hit.lon)) return null;
  return { lat: hit.lat, lon: hit.lon };
}

export type RouteResult = { distanceKm: number; durationMinutes: number | null };

/**
 * Uses Google Directions API when GOOGLE_MAPS_API_KEY is set and departureTime given
 * (for traffic-aware duration). Otherwise falls back to OSRM (distance only).
 */
export async function getRouteDistanceAndDuration(
  pickupAddress: string,
  deliveryAddress: string,
  departureTime?: Date | null
): Promise<RouteResult | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const useGoogle = !!key && !!departureTime;

  if (useGoogle) {
    try {
      const params = new URLSearchParams({
        origin: pickupAddress.trim(),
        destination: deliveryAddress.trim(),
        key,
        mode: "driving",
      });
      params.set("departure_time", String(Math.floor(departureTime!.getTime() / 1000)));
      const res = await fetch(`${GOOGLE_DIRECTIONS_URL}?${params.toString()}`);
      const data = await res.json();
      if (data.status !== "OK" || !data.routes?.[0]?.legs?.[0]) return null;
      const leg = data.routes[0].legs[0];
      const distanceMeters = leg.distance?.value ?? 0;
      const durationSeconds = leg.duration_in_traffic?.value ?? leg.duration?.value ?? 0;
      return {
        distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
        durationMinutes: Math.round(durationSeconds / 60),
      };
    } catch {
      // fall through to OSRM
    }
  }

  const [from, to] = await Promise.all([
    geocodeAddressForMap(pickupAddress.trim()),
    geocodeAddressForMap(deliveryAddress.trim()),
  ]);
  if (!from || !to) return null;
  try {
    const res = await fetch(
      `${OSRM_URL}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
    );
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const distanceMeters = data.routes[0].distance;
    return {
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      durationMinutes: null,
    };
  } catch {
    return null;
  }
}

/**
 * Returns route distance in km (driving) or null if calculation fails.
 * Used server-side only for locking price. Prefer getRouteDistanceAndDuration when you have pickup time.
 */
export async function getRouteDistanceKm(
  pickupAddress: string,
  deliveryAddress: string
): Promise<number | null> {
  const result = await getRouteDistanceAndDuration(pickupAddress, deliveryAddress, null);
  return result ? result.distanceKm : null;
}
