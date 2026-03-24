/**
 * Terrain & weather ids map to drive-time multipliers.
 * Terrain/weather are chosen automatically on the server (Google Elevation + Google/Open-Meteo weather).
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

export function isRouteTerrainId(s: string): s is RouteTerrainId {
  return (ROUTE_TERRAINS as readonly string[]).includes(s);
}

export function isRouteWeatherId(s: string): s is RouteWeatherId {
  return (ROUTE_WEATHERS as readonly string[]).includes(s);
}

/**
 * Multiplier applied to one-way route minutes (before doubling for round trip).
 */
export function routeDriveTimeMultiplier(terrain: string, weather: string): number {
  const t = isRouteTerrainId(terrain) ? terrain : "flat";
  const w = isRouteWeatherId(weather) ? weather : "clear";
  return TERRAIN_MULT[t] * WEATHER_MULT[w];
}
