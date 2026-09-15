/** Normalize / validate driver GPS for Germany transport jobs. */

const DE_LAT_MIN = 47;
const DE_LAT_MAX = 55.2;
const DE_LNG_MIN = 5.5;
const DE_LNG_MAX = 15.5;

/** Reject coarse browser fixes (cell-tower / IP) that land far from the real street. */
export const MAX_GPS_ACCURACY_M = 80;

export function isUsableGpsAccuracy(accuracyM?: number | null): boolean {
  if (accuracyM == null || !Number.isFinite(accuracyM)) return true;
  return accuracyM > 0 && accuracyM <= MAX_GPS_ACCURACY_M;
}

/**
 * Swap lat/lng when the pair looks inverted (common in some Android/WebView payloads).
 * Germany: lat ≈ 47–55, lng ≈ 6–15.
 */
export function normalizeDriverGps(
  latRaw: number,
  lngRaw: number
): { lat: number; lng: number } | null {
  if (!Number.isFinite(latRaw) || !Number.isFinite(lngRaw)) return null;
  let lat = latRaw;
  let lng = lngRaw;
  if (lat >= DE_LNG_MIN && lat <= DE_LNG_MAX && lng >= DE_LAT_MIN && lng <= DE_LAT_MAX) {
    lat = lngRaw;
    lng = latRaw;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
