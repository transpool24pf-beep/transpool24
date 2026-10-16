import { NextResponse } from "next/server";
import { ADSENSE_ADS_TXT } from "@/lib/adsense-config";

const ADS_TXT = `${ADSENSE_ADS_TXT}\n`;

export async function GET() {
  return new NextResponse(ADS_TXT, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
