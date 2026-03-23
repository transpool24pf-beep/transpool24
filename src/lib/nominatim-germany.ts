/**
 * OpenStreetMap Nominatim — Germany-focused geocoding & suggestions.
 * Respect usage policy: server-side only, identify via User-Agent.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export const NOMINATIM_HEADERS = {
  "User-Agent": "TransPool24/1.0 (https://www.transpool24.com)",
  Accept: "application/json",
} as const;

export type NominatimHit = {
  display_name: string;
  lat: number;
  lon: number;
};

function mapRow(x: { display_name: string; lat: string; lon: string }): NominatimHit {
  return {
    display_name: x.display_name,
    lat: parseFloat(x.lat),
    lon: parseFloat(x.lon),
  };
}

/**
 * Suggestions: German PLZ (exactly 5 digits) uses structured postalcode search,
 * merged with free-text q= search (street + PLZ, city names, etc.).
 */
export async function nominatimSuggestGermany(queryRaw: string, maxTotal = 10): Promise<NominatimHit[]> {
  const q = queryRaw.trim();
  if (q.length < 3) return [];

  const hits: NominatimHit[] = [];
  const seen = new Set<string>();

  const pushUnique = (rows: { display_name: string; lat: string; lon: string }[]) => {
    for (const x of rows) {
      if (!x?.display_name || x.lat == null || x.lon == null) continue;
      const k = `${x.lat},${x.lon},${x.display_name.slice(0, 120)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      hits.push(mapRow(x));
      if (hits.length >= maxTotal) break;
    }
  };

  try {
    // Structured: German postcode only (e.g. 75175 → localities in that PLZ)
    if (/^\d{5}$/.test(q)) {
      const res = await fetch(
        `${NOMINATIM_URL}?format=json&postalcode=${encodeURIComponent(q)}&country=de&limit=10`,
        { headers: NOMINATIM_HEADERS }
      );
      const data = await res.json();
      if (Array.isArray(data)) pushUnique(data);
    }

    if (hits.length < maxTotal) {
      const res = await fetch(
        `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(q)}&limit=8&countrycodes=de`,
        { headers: NOMINATIM_HEADERS }
      );
      const data = await res.json();
      if (Array.isArray(data)) pushUnique(data);
    }
  } catch {
    return hits;
  }

  return hits.slice(0, maxTotal);
}

/** Single best point for routing (pickup/delivery strings or PLZ). */
export async function geocodeGermanyOne(address: string): Promise<NominatimHit | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  const list = await nominatimSuggestGermany(trimmed, 5);
  return list[0] ?? null;
}
