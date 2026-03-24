import { NextResponse } from "next/server";
import { NOMINATIM_HEADERS } from "@/lib/nominatim-germany";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

type NominatimRow = {
  display_name?: string;
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

function hintFromRow(row: NominatimRow): string | null {
  const a = row.address;
  if (a) {
    const road = a.road || a.pedestrian || a.residential;
    if (road?.trim()) return road.trim();
    const place =
      a.city || a.town || a.village || a.municipality || a.hamlet;
    if (place?.trim()) return place.trim();
  }
  const dn = row.display_name?.trim();
  if (dn) {
    const parts = dn.split(",").map((p) => p.trim());
    if (parts.length >= 2 && /^\d{5}$/.test(parts[0] ?? "")) {
      return parts[1] ?? null;
    }
    if (parts.length >= 1) return parts[0] ?? null;
  }
  return null;
}

/**
 * Best-effort line for the “Straße” field after a 5-digit DE postcode:
 * prefers a road name from OSM; otherwise city/town/village for that PLZ.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("postcode") ?? "";
  const pc = raw.replace(/\D/g, "").slice(0, 5);
  if (!/^\d{5}$/.test(pc)) {
    return NextResponse.json({ hint: null, error: "invalid_postcode" }, { status: 400 });
  }

  try {
    const url = `${NOMINATIM_URL}?format=json&postalcode=${encodeURIComponent(pc)}&country=de&limit=8&addressdetails=1`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS, cache: "no-store" });
    const data = (await res.json()) as NominatimRow[];
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ hint: null });
    }
    for (const row of data) {
      const a = row.address;
      const road = a?.road || a?.pedestrian || a?.residential;
      if (road?.trim()) {
        return NextResponse.json({ hint: road.trim() });
      }
    }
    for (const row of data) {
      const h = hintFromRow(row);
      if (h) return NextResponse.json({ hint: h });
    }
    return NextResponse.json({ hint: null });
  } catch (e) {
    console.error("[postcode-street-hint]", e);
    return NextResponse.json({ hint: null }, { status: 500 });
  }
}
