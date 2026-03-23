import { NextResponse } from "next/server";
import { nominatimSuggestGermany } from "@/lib/nominatim-germany";
import { googlePlacesAutocompleteGermany } from "@/lib/places-germany";

export type AddressSuggestion = {
  display_name: string;
  lat?: number;
  lon?: number;
  place_id?: string;
  source?: "google" | "nominatim";
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const session = searchParams.get("session") ?? "no-session";
  if (!q || q.trim().length < 3) {
    return NextResponse.json([]);
  }

  const trimmed = q.trim();
  const key = process.env.GOOGLE_MAPS_API_KEY;

  try {
    // Prefer Google Places when configured → street + house number quality in DE
    if (key) {
      const predictions = await googlePlacesAutocompleteGermany(trimmed, session, key);
      if (predictions.length > 0) {
        const out: AddressSuggestion[] = predictions.slice(0, 10).map((p) => ({
          display_name: p.description,
          place_id: p.place_id,
          source: "google" as const,
        }));
        return NextResponse.json(out);
      }
    }

    const nomi = await nominatimSuggestGermany(trimmed, 10);
    const out: AddressSuggestion[] = nomi.map((n) => ({
      display_name: n.display_name,
      lat: n.lat,
      lon: n.lon,
      source: "nominatim" as const,
    }));
    return NextResponse.json(out);
  } catch (e) {
    console.error("[address-suggestions]", e);
    return NextResponse.json([]);
  }
}
