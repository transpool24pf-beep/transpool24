import { NextResponse } from "next/server";
import { getBookingsSettings } from "@/lib/bookings-settings";

/** Public: whether new transport bookings are temporarily paused (no auth). */
export async function GET() {
  const { paused } = await getBookingsSettings();
  return NextResponse.json({ paused }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
