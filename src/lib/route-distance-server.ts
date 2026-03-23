import { geocodeGermanyOne } from "./nominatim-germany";
import { fetchGoogleDrivingRoute, googleGeocodeGermany } from "./google-maps-route";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

/**
 * Geocode for map pins / OSRM. Nominatim first, then Google Geocoding when API key is set
 * (Google Places formatted lines often fail Nominatim).
 */
export async function geocodeAddressForMap(address: string): Promise<{ lat: number; lon: number } | null> {
  const hit = await geocodeGermanyOne(address);
  if (hit && Number.isFinite(hit.lat) && Number.isFinite(hit.lon)) {
    return { lat: hit.lat, lon: hit.lon };
  }
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (key) {
    const g = await googleGeocodeGermany(address, key);
    if (g) return g;
  }
  return null;
}

export type RouteResult = { distanceKm: number; durationMinutes: number | null };

/**
 * Driving distance (and duration when possible). Uses Google Directions when GOOGLE_MAPS_API_KEY
 * is set (works with Places-formatted addresses). With departureTime, duration uses traffic when available.
 * Falls back to Nominatim geocode + OSRM.
 */
export async function getRouteDistanceAndDuration(
  pickupAddress: string,
  deliveryAddress: string,
  departureTime?: Date | null
): Promise<RouteResult | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;

  if (key) {
    const googleRoute = await fetchGoogleDrivingRoute(
      pickupAddress.trim(),
      deliveryAddress.trim(),
      key,
      departureTime ?? null
    );
    if (googleRoute) {
      return {
        distanceKm: googleRoute.distanceKm,
        durationMinutes: googleRoute.durationMinutes,
      };
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
    const route = data.routes[0];
    const distanceMeters = route.distance;
    const durationSeconds = typeof route.duration === "number" ? route.duration : 0;
    return {
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      durationMinutes: durationSeconds > 0 ? Math.round(durationSeconds / 60) : null,
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
