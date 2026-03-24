/**
 * Customer-chosen route conditions (weight, terrain, weather) adjust effective drive time
 * and add a small weight surcharge (€0.20 per 10 kg). Used client + server (confirm-order).
 */

export const ROUTE_TERRAINS = ["flat", "rolling", "hilly", "mountain"] as const;
export const ROUTE_WEATHERS = ["clear", "rain", "snow_ice"] as const;

export type RouteTerrainId = (typeof ROUTE_TERRAINS)[number];
export type RouteWeatherId = (typeof ROUTE_WEATHERS)[number];

const TERRAIN_MULT: Record<RouteTerrainId, number> = {
  flat: 1,
  rolling: 1.05,
  hilly: 1.1,
  mountain: 1.18,
};

const WEATHER_MULT: Record<RouteWeatherId, number> = {
  clear: 1,
  rain: 1.08,
  snow_ice: 1.2,
};

/** Heavier loads → lower effective speed on the road segment (capped). */
export function weightSlowdownFactor(weightKg: number): number {
  const w = Math.max(0, Number(weightKg) || 0);
  return 1 + Math.min(0.35, w / 450);
}

export function isRouteTerrainId(s: string): s is RouteTerrainId {
  return (ROUTE_TERRAINS as readonly string[]).includes(s);
}

export function isRouteWeatherId(s: string): s is RouteWeatherId {
  return (ROUTE_WEATHERS as readonly string[]).includes(s);
}

/**
 * Multiplier applied to one-way route minutes (before doubling for round trip).
 */
export function routeDriveTimeMultiplier(terrain: string, weather: string, weightKg: number): number {
  const t = isRouteTerrainId(terrain) ? terrain : "flat";
  const w = isRouteWeatherId(weather) ? weather : "clear";
  return TERRAIN_MULT[t] * WEATHER_MULT[w] * weightSlowdownFactor(weightKg);
}

/** €0.20 per full 10 kg (20 cents / 10 kg). */
export function weightSurchargeCentsFromKg(weightKg: number): number {
  const w = Math.max(0, Math.floor(Number(weightKg) || 0));
  return Math.floor(w / 10) * 20;
}
