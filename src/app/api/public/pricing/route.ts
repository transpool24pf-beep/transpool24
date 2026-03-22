import { NextResponse } from "next/server";
import { getPricingSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Public read-only pricing for order form (matches server-side confirm-order). */
export async function GET() {
  try {
    const p = await getPricingSettings();
    return NextResponse.json({
      price_per_km_cents: p.price_per_km_cents ?? { XS: 80, M: 120, L: 200 },
      driver_hourly_rate_cents: p.driver_hourly_rate_cents ?? 2500,
      driver_only_hourly_cents: p.driver_only_hourly_cents ?? 4500,
      assistant_fee_cents: p.assistant_fee_cents ?? 1630,
    });
  } catch (e) {
    console.error("[public/pricing]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
