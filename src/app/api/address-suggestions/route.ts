import { NextResponse } from "next/server";
import { nominatimSuggestGermany } from "@/lib/nominatim-germany";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q || q.trim().length < 3) {
    return NextResponse.json([]);
  }
  try {
    const list = await nominatimSuggestGermany(q.trim(), 10);
    return NextResponse.json(list);
  } catch (e) {
    console.error("[address-suggestions]", e);
    return NextResponse.json([]);
  }
}
