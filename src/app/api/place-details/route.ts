import { NextResponse } from "next/server";
import { googlePlaceDetailsGermany } from "@/lib/places-germany";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("place_id");
  const session = searchParams.get("session") ?? "";
  const key = process.env.GOOGLE_MAPS_API_KEY;

  if (!placeId?.trim()) {
    return NextResponse.json({ error: "Missing place_id" }, { status: 400 });
  }
  if (!key) {
    return NextResponse.json({ error: "Places not configured" }, { status: 503 });
  }

  const details = await googlePlaceDetailsGermany(placeId.trim(), session, key);
  if (!details) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  return NextResponse.json({
    formatted_address: details.formatted_address,
    lat: details.lat,
    lng: details.lng,
    street: details.street,
    houseNumber: details.houseNumber,
    postcode: details.postcode,
  });
}
