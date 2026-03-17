import { createServerSupabase } from "./supabase";

export type PricingSettings = {
  price_per_km_cents?: Record<string, number>;
  driver_hourly_rate_cents?: number;
  driver_only_hourly_cents?: number;
  assistant_fee_cents?: number;
};

const DEFAULTS: PricingSettings = {
  price_per_km_cents: { XS: 80, M: 120, L: 200 },
  driver_hourly_rate_cents: 2500,
  driver_only_hourly_cents: 4500, // 45 EUR/h for driver-only
  assistant_fee_cents: 1630,      // 16.30 EUR per job
};

export async function getPricingSettings(): Promise<PricingSettings> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "pricing")
      .single();
    if (data?.value && typeof data.value === "object") {
      return { ...DEFAULTS, ...(data.value as PricingSettings) };
    }
  } catch {
    // ignore
  }
  return DEFAULTS;
}
