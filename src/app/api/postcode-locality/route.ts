import { NextResponse } from "next/server";
import { localityFromGermanPostcode } from "@/lib/de-postcode-locality";

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("postcode") ?? "";
  const pc = raw.replace(/\D/g, "").slice(0, 5);
  if (!/^\d{5}$/.test(pc)) {
    return NextResponse.json({ city: null, error: "invalid_postcode" }, { status: 400 });
  }
  try {
    const city = await localityFromGermanPostcode(pc);
    return NextResponse.json({ city, postcode: pc });
  } catch (e) {
    console.error("[postcode-locality]", e);
    return NextResponse.json({ city: null }, { status: 200 });
  }
}
