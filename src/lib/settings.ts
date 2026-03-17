import { createServerSupabase } from "./supabase";

export type PricingSettings = {
  price_per_km_cents?: Record<string, number>;
  driver_hourly_rate_cents?: number;
};

const DEFAULTS: PricingSettings = {
  price_per_km_cents: { XS: 80, M: 120, L: 200 },
  driver_hourly_rate_cents: 2500,
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
