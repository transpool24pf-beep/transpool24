import { NextResponse } from "next/server";

const ADS_TXT =
  "google.com, pub-9998186124580672, DIRECT, f08c47fec0942fa0\n";

export async function GET() {
  return new NextResponse(ADS_TXT, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
