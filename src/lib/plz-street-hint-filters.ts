/**
 * Filters for PLZ-only street hints. A postcode maps to many streets; we drop
 * common false positives and require postcode agreement on geocoder results.
 */

export function formattedAddressContainsPostcode(formatted: string, pc5: string): boolean {
  if (!/^\d{5}$/.test(pc5)) return false;
  return new RegExp(`\\b${pc5}\\b`).test(formatted);
}

/** Names that often appear as junk when geocoding "PLZ, Deutschland" (not a useful default). */
export function isUnreliablePlzAutoStreet(name: string): boolean {
  const compact = name
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "");
  return (
    compact === "deutschlandstraße" ||
    compact === "deutschlandstr" ||
    compact === "bundesrepublikdeutschland" ||
    /^deutschland\d+$/.test(compact)
  );
}
