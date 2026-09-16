import { NextResponse } from "next/server";
import { geocodeGermanyCity } from "@/lib/nominatim-germany";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ lat: null, lon: null, label: null });
  }
  const hit = await geocodeGermanyCity(q);
  if (!hit) {
    return NextResponse.json({ lat: null, lon: null, label: null });
  }
  return NextResponse.json({ lat: hit.lat, lon: hit.lon, label: hit.display_name });
}
