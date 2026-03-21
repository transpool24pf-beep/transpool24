import { NextResponse } from "next/server";
import { getWhyPagePayload } from "@/lib/get-why-page-payload";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  try {
    const { locale } = await params;
    const payload = await getWhyPagePayload(locale);
    return NextResponse.json(
      { payload },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (e) {
    console.error("[public/why-transpool24 GET]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
