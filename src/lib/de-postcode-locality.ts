import { NOMINATIM_HEADERS } from "@/lib/nominatim-germany";

type OpenPlzLocality = { name?: string };

function pickLocalityName(names: string[]): string | null {
  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n.length >= 2))];
  if (unique.length === 0) return null;
  if (unique.length === 1) return unique[0]!;
  const shortest = unique.reduce((a, b) => (a.length <= b.length ? a : b));
  return shortest;
}

async function localityFromOpenPlz(pc: string): Promise<string | null> {
  const res = await fetch(`https://openplzapi.org/de/Localities?postalCode=${encodeURIComponent(pc)}`, {
    headers: { Accept: "application/json", "User-Agent": "TransPool24/1.0 (https://www.transpool24.com)" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as OpenPlzLocality[];
  if (!Array.isArray(rows)) return null;
  return pickLocalityName(rows.map((r) => r.name ?? ""));
}

async function localityFromNominatim(pc: string): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(pc)}&country=de&limit=8&addressdetails=1`;
  const res = await fetch(url, { headers: NOMINATIM_HEADERS, cache: "no-store" });
  if (!res.ok) return null;
  const rows = (await res.json()) as {
    address?: { city?: string; town?: string; village?: string; municipality?: string; hamlet?: string };
  }[];
  if (!Array.isArray(rows)) return null;
  const names = rows.map(
    (r) => r.address?.city || r.address?.town || r.address?.village || r.address?.municipality || r.address?.hamlet || "",
  );
  return pickLocalityName(names);
}

/** Resolve German PLZ → Ort (OpenPLZ, then Nominatim). */
export async function localityFromGermanPostcode(pcRaw: string): Promise<string | null> {
  const pc = pcRaw.replace(/\D/g, "").slice(0, 5);
  if (!/^\d{5}$/.test(pc)) return null;
  try {
    const open = await localityFromOpenPlz(pc);
    if (open) return open;
  } catch {
    /* fall through */
  }
  try {
    return await localityFromNominatim(pc);
  } catch {
    return null;
  }
}
