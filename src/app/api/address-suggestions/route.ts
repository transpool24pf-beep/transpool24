import { NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q || q.length < 3) {
    return NextResponse.json([]);
  }
  try {
    const res = await fetch(
      `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=de`,
      {
        headers: {
          "User-Agent": "TransPool24/1.0 (contact@transpool24.com)",
          Accept: "application/json",
        },
      }
    );
    const data = await res.json();
    const list = Array.isArray(data)
      ? data.map((x: { display_name: string; lat: string; lon: string }) => ({
          display_name: x.display_name,
          lat: parseFloat(x.lat),
          lon: parseFloat(x.lon),
        }))
      : [];
    return NextResponse.json(list);
  } catch (e) {
    console.error("[address-suggestions]", e);
    return NextResponse.json([]);
  }
}
