/**
 * Server-only: derive terrain from Google Elevation along the corridor, weather from
 * Google Weather (if enabled on the key) else Open-Meteo at route midpoint.
 */

import type { RouteTerrainId, RouteWeatherId } from "@/lib/route-pricing-factors";
import { ROUTE_WEATHERS } from "@/lib/route-pricing-factors";

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Classify terrain from cumulative climb along sampled path (m climb per km). */
export function classifyTerrainFromElevationsMeters(
  elevations: number[],
  pathKm: number
): RouteTerrainId {
  if (elevations.length < 2 || pathKm <= 0) return "flat";
  let gain = 0;
  for (let i = 1; i < elevations.length; i++) {
    const d = elevations[i] - elevations[i - 1];
    if (d > 0) gain += d;
  }
  const mPerKm = gain / pathKm;
  if (mPerKm < 22) return "flat";
  if (mPerKm < 65) return "rolling";
  if (mPerKm < 130) return "hilly";
  return "mountain";
}

export async function terrainFromGoogleElevation(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  apiKey: string | undefined
): Promise<RouteTerrainId> {
  if (!apiKey) return "flat";
  const path = `${from.lat},${from.lon}|${to.lat},${to.lon}`;
  const url = `https://maps.googleapis.com/maps/api/elevation/json?path=${encodeURIComponent(path)}&samples=14&key=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url);
    const data = (await res.json()) as {
      status: string;
      results?: Array<{ elevation: number }>;
    };
    if (data.status !== "OK" || !data.results?.length) return "rolling";
    const elevations = data.results.map((r) => r.elevation);
    const km = Math.max(0.5, haversineKm(from, to));
    return classifyTerrainFromElevationsMeters(elevations, km);
  } catch {
    return "rolling";
  }
}

function mapWmoToWeather(code: number): RouteWeatherId {
  if (code >= 71 || code === 85 || code === 86 || code === 77) return "snow_ice";
  if (code >= 51 && code <= 67) return "rain";
  return "clear";
}

/** Open-Meteo (no API key). Used when Google Weather is unavailable. */
export async function weatherFromOpenMeteo(
  lat: number,
  lng: number
): Promise<{ weather: RouteWeatherId; source: "open-meteo" }> {
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=weather_code&timezone=auto`;
  try {
    const res = await fetch(u, { cache: "no-store" });
    const data = (await res.json()) as { current?: { weather_code?: number } };
    const code = typeof data.current?.weather_code === "number" ? data.current.weather_code : 0;
    return { weather: mapWmoToWeather(code), source: "open-meteo" };
  } catch {
    return { weather: "clear", source: "open-meteo" };
  }
}

/** Map Google Weather API condition strings to internal ids. */
function mapGoogleConditionToWeather(condition: string | undefined): RouteWeatherId | null {
  if (!condition) return null;
  const c = condition.toUpperCase();
  if (c.includes("SNOW") || c.includes("SLEET") || c.includes("ICE") || c.includes("BLIZZARD"))
    return "snow_ice";
  if (
    c.includes("RAIN") ||
    c.includes("DRIZZLE") ||
    c.includes("THUNDER") ||
    c.includes("SHOWER")
  )
    return "rain";
  if (c.includes("FOG") || c.includes("HAZE")) return "rain";
  if (c.includes("CLEAR") || c.includes("SUNNY") || c.includes("CLOUD")) return "clear";
  return null;
}

/**
 * Google Maps Platform — Weather API (enable "Weather API" on the same project as the key).
 * Falls back to null so caller can use Open-Meteo.
 */
export async function weatherFromGoogle(
  lat: number,
  lng: number,
  apiKey: string | undefined
): Promise<{ weather: RouteWeatherId; source: "google-weather" } | null> {
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://weather.googleapis.com/v1/currentConditions:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: { latitude: lat, longitude: lng } }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      weatherCondition?: { description?: { text?: string }; type?: string };
    };
    const text =
      data.weatherCondition?.description?.text ?? data.weatherCondition?.type ?? "";
    const mapped = mapGoogleConditionToWeather(text) ?? mapGoogleConditionToWeather(data.weatherCondition?.type);
    if (!mapped || !ROUTE_WEATHERS.includes(mapped)) return null;
    return { weather: mapped, source: "google-weather" };
  } catch {
    return null;
  }
}

export async function resolveWeatherForMidpoint(
  lat: number,
  lng: number,
  apiKey: string | undefined
): Promise<{ weather: RouteWeatherId; source: "google-weather" | "open-meteo" }> {
  const g = await weatherFromGoogle(lat, lng, apiKey);
  if (g) return g;
  const o = await weatherFromOpenMeteo(lat, lng);
  return { weather: o.weather, source: o.source };
}
