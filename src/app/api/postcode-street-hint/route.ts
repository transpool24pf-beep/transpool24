import { NextResponse } from "next/server";
import { NOMINATIM_HEADERS } from "@/lib/nominatim-germany";
import { googleStreetHintFromPostcodeGermany } from "@/lib/places-germany";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

type NominatimRow = {
  display_name?: string;
  osm_id?: number;
  osm_type?: string;
  address?: {
    road?: string;
    pedestrian?: string;
    residential?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    hamlet?: string;
  };
};

function roadFromRow(row: NominatimRow): string | null {
  const a = row.address;
  const road = a?.road || a?.pedestrian || a?.residential;
  return road?.trim() && road.trim().length >= 2 ? road.trim() : null;
}

function localityFromRow(row: NominatimRow): string | null {
  const a = row.address;
  const place = a?.city || a?.town || a?.village || a?.municipality || a?.hamlet;
  if (place?.trim()) return place.trim();
  const dn = row.display_name?.trim();
  if (dn) {
    const parts = dn.split(",").map((p) => p.trim());
    if (parts.length >= 2 && /^\d{5}$/.test(parts[0] ?? "")) return parts[1] ?? null;
    if (parts.length >= 1) return parts[0] ?? null;
  }
  return null;
}

function dedupeRows(rows: NominatimRow[]): NominatimRow[] {
  const seen = new Set<string>();
  const out: NominatimRow[] = [];
  for (const row of rows) {
    const id = row.osm_id;
    const t = row.osm_type;
    const k =
      id != null && t ? `${t}:${id}` : (row.display_name ?? "").slice(0, 100) + (row.address?.road ?? "");
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(row);
  }
  return out;
}

async function nominatimHints(pc: string): Promise<NominatimRow[]> {
  const q1 = `${NOMINATIM_URL}?format=json&postalcode=${encodeURIComponent(pc)}&country=de&limit=25&addressdetails=1`;
  const q2 = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(`${pc}, Deutschland`)}&countrycodes=de&limit=25&addressdetails=1`;

  const [res1, res2] = await Promise.all([
    fetch(q1, { headers: NOMINATIM_HEADERS, cache: "no-store" }),
    fetch(q2, { headers: NOMINATIM_HEADERS, cache: "no-store" }),
  ]);
  const data1 = (await res1.json()) as NominatimRow[];
  const data2 = (await res2.json()) as NominatimRow[];
  const a = Array.isArray(data1) ? data1 : [];
  const b = Array.isArray(data2) ? data2 : [];
  return dedupeRows([...a, ...b]);
}

function bestHintFromNominatim(rows: NominatimRow[]): string | null {
  for (const row of rows) {
    const r = roadFromRow(row);
    if (r) return r;
  }
  for (const row of rows) {
    const loc = localityFromRow(row);
    if (loc) return loc;
  }
  return null;
}

/**
 * Straße / Ort for the booking form: prefers full street name (Google → OSM), else city.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("postcode") ?? "";
  const pc = raw.replace(/\D/g, "").slice(0, 5);
  if (!/^\d{5}$/.test(pc)) {
    return NextResponse.json({ hint: null, error: "invalid_postcode" }, { status: 400 });
  }

  try {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (key) {
      const g = await googleStreetHintFromPostcodeGermany(pc, key);
      if (g) return NextResponse.json({ hint: g, source: "google" as const });
    }

    const rows = await nominatimHints(pc);
    if (rows.length === 0) return NextResponse.json({ hint: null });
    const hint = bestHintFromNominatim(rows);
    return NextResponse.json({ hint, source: hint ? ("nominatim" as const) : null });
  } catch (e) {
    console.error("[postcode-street-hint]", e);
    return NextResponse.json({ hint: null }, { status: 500 });
  }
}
