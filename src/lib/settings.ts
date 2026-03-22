import { createServerSupabase } from "./supabase";

export type PricingSettings = {
  price_per_km_cents?: Record<string, number>;
  driver_hourly_rate_cents?: number;
  driver_only_hourly_cents?: number;
  assistant_fee_cents?: number;
};

/** Defaults + merge source for admin API and getPricingSettings */
export const PRICING_DEFAULTS: PricingSettings = {
  price_per_km_cents: { XS: 80, M: 120, L: 200 },
  driver_hourly_rate_cents: 2500,
  driver_only_hourly_cents: 4500, // 45 EUR/h for driver-only
  assistant_fee_cents: 1630, // 16.30 EUR per job (driver + car + assistant)
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
      return { ...PRICING_DEFAULTS, ...(data.value as PricingSettings) };
    }
  } catch {
    // ignore
  }
  return PRICING_DEFAULTS;
}
