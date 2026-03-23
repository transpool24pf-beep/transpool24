/**
 * Google Directions + Geocoding (server-side). Uses GOOGLE_MAPS_API_KEY.
 * Decodes overview_polyline to GeoJSON LineString for map display.
 */

const GOOGLE_DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json";
const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export type RouteLineString = {
  type: "LineString";
  coordinates: [number, number][];
};

export type GoogleDrivingRouteResult = {
  distanceKm: number;
  durationMinutes: number | null;
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  geometry: RouteLineString | null;
};

/** Decode Google's encoded polyline to [lng, lat][] for GeoJSON. */
export function decodeGooglePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    points.push([lng / 1e5, lat / 1e5]);
  }
  return points;
}

/**
 * Driving route from free-text addresses (e.g. Places formatted address).
 * When departureTime is set, requests traffic-aware duration (duration_in_traffic).
 */
export async function fetchGoogleDrivingRoute(
  origin: string,
  destination: string,
  apiKey: string,
  departureTime?: Date | null
): Promise<GoogleDrivingRouteResult | null> {
  const trimmedOrigin = origin.trim();
  const trimmedDest = destination.trim();
  if (!trimmedOrigin || !trimmedDest) return null;

  const params = new URLSearchParams({
    origin: trimmedOrigin,
    destination: trimmedDest,
    key: apiKey,
    mode: "driving",
    region: "de",
  });
  if (departureTime) {
    params.set("departure_time", String(Math.floor(departureTime.getTime() / 1000)));
  }

  try {
    const res = await fetch(`${GOOGLE_DIRECTIONS_URL}?${params.toString()}`);
    const data = (await res.json()) as {
      status: string;
      routes?: Array<{
        overview_polyline?: { points?: string };
        legs?: Array<{
          distance?: { value?: number };
          duration?: { value?: number };
          duration_in_traffic?: { value?: number };
          start_location?: { lat: number; lng: number };
          end_location?: { lat: number; lng: number };
        }>;
      }>;
    };

    if (data.status !== "OK" || !data.routes?.[0]?.legs?.[0]) {
      const err = (data as { error_message?: string }).error_message;
      console.warn("[google-directions]", data.status, err ?? "");
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs![0];
    const distanceMeters = leg.distance?.value ?? 0;
    const durationSeconds = departureTime
      ? leg.duration_in_traffic?.value ?? leg.duration?.value ?? 0
      : leg.duration?.value ?? 0;

    const start = leg.start_location;
    const end = leg.end_location;
    if (!start || !end) return null;

    let geometry: RouteLineString | null = null;
    const encoded = route.overview_polyline?.points;
    if (encoded) {
      const coords = decodeGooglePolyline(encoded);
      if (coords.length >= 2) {
        geometry = { type: "LineString", coordinates: coords };
      }
    }

    return {
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      durationMinutes: durationSeconds > 0 ? Math.round(durationSeconds / 60) : null,
      from: { lat: start.lat, lon: start.lng },
      to: { lat: end.lat, lon: end.lng },
      geometry,
    };
  } catch {
    return null;
  }
}

async function googleGeocodeOnce(
  q: string,
  apiKey: string,
  withCountryDe: boolean
): Promise<{ lat: number; lon: number } | null> {
  const params = new URLSearchParams({
    address: q,
    key: apiKey,
    region: "de",
  });
  if (withCountryDe) params.set("components", "country:DE");
  const res = await fetch(`${GOOGLE_GEOCODE_URL}?${params.toString()}`);
  const data = (await res.json()) as {
    status: string;
    error_message?: string;
    results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }>;
  };
  if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
    if (data.status !== "ZERO_RESULTS") {
      console.warn("[google-geocode]", data.status, data.error_message ?? "");
    }
    return null;
  }
  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lon: loc.lng };
}

/** Single-point geocode (Germany bias). For fallback when Nominatim misses Places strings. */
export async function googleGeocodeGermany(
  address: string,
  apiKey: string
): Promise<{ lat: number; lon: number } | null> {
  const q = address.trim();
  if (!q) return null;
  try {
    const strict = await googleGeocodeOnce(q, apiKey, true);
    if (strict) return strict;
    return await googleGeocodeOnce(q, apiKey, false);
  } catch {
    return null;
  }
}
