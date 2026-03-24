import { createServerSupabase } from "./supabase";

/** Optional flat surcharge per B2B cargo category (cents per order), for small price differences. */
export type CargoCategoryAdjustmentCents = Record<string, number>;

export type PricingSettings = {
  price_per_km_cents?: Record<string, number>;
  driver_hourly_rate_cents?: number;
  driver_only_hourly_cents?: number;
  assistant_fee_cents?: number;
  /** Cents charged per full 10 kg block (e.g. 50 = 0,50 € / 10 kg). */
  weight_surcharge_cents_per_10kg?: number;
  cargo_category_adjustment_cents?: CargoCategoryAdjustmentCents;
};

const DEFAULT_CARGO_CATEGORY_ADJUSTMENTS: CargoCategoryAdjustmentCents = {
  gold_precision_sensitive: 0,
  vehicle_parts_urgent: 0,
  wholesale_dry_food: 0,
  printing_packaging: 0,
  general_other: 0,
};

/** Defaults + merge source for admin API and getPricingSettings */
export const PRICING_DEFAULTS: PricingSettings = {
  price_per_km_cents: { XS: 80, M: 120, L: 200 },
  driver_hourly_rate_cents: 2500,
  driver_only_hourly_cents: 4500, // 45 EUR/h for driver-only
  assistant_fee_cents: 1630, // 16.30 EUR/h for assistant (× total driver billing minutes / 60)
  weight_surcharge_cents_per_10kg: 50, // 0,50 € per 10 kg
  cargo_category_adjustment_cents: { ...DEFAULT_CARGO_CATEGORY_ADJUSTMENTS },
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
      const v = data.value as PricingSettings;
      return {
        ...PRICING_DEFAULTS,
        ...v,
        price_per_km_cents: { ...PRICING_DEFAULTS.price_per_km_cents, ...v.price_per_km_cents },
        cargo_category_adjustment_cents: {
          ...PRICING_DEFAULTS.cargo_category_adjustment_cents,
          ...v.cargo_category_adjustment_cents,
        },
      };
    }
  } catch {
    // ignore
  }
  return PRICING_DEFAULTS;
}
