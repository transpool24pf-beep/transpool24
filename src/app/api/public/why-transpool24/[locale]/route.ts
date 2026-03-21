import { NextResponse } from "next/server";
import { getWhyPagePayload } from "@/lib/get-why-page-payload";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  try {
    const { locale } = await params;
    const payload = await getWhyPagePayload(locale);
    return NextResponse.json({ payload });
  } catch (e) {
    console.error("[public/why-transpool24 GET]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
