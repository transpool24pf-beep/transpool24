import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { PRICING_DEFAULTS, type PricingSettings } from "@/lib/settings";

const PRICING_KEY = "pricing";

function mergePricing(
  stored: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>
): PricingSettings {
  const s = stored ?? {};
  const perKmPatch = patch.price_per_km_cents as Record<string, number> | undefined;
  const perKmStored = s.price_per_km_cents as Record<string, number> | undefined;
  const catPatch = patch.cargo_category_adjustment_cents as Record<string, number> | undefined;
  const catStored = s.cargo_category_adjustment_cents as Record<string, number> | undefined;
  const weightPatch = patch.weight_surcharge_cents_per_10kg;
  const weightStored = s.weight_surcharge_cents_per_10kg;
  return {
    ...PRICING_DEFAULTS,
    ...(s as PricingSettings),
    ...patch,
    price_per_km_cents: {
      ...PRICING_DEFAULTS.price_per_km_cents,
      ...perKmStored,
      ...perKmPatch,
    },
    cargo_category_adjustment_cents: {
      ...PRICING_DEFAULTS.cargo_category_adjustment_cents,
      ...catStored,
      ...catPatch,
    },
    weight_surcharge_cents_per_10kg:
      weightPatch != null
        ? Math.max(0, Math.round(Number(weightPatch)))
        : typeof weightStored === "number"
          ? Math.max(0, Math.round(weightStored))
          : PRICING_DEFAULTS.weight_surcharge_cents_per_10kg,
  };
}

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .eq("key", PRICING_KEY)
    .single();
  if (error && error.code !== "PGRST116") {
    console.error("[admin/settings]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const value = mergePricing(data?.value as Record<string, unknown> | undefined, {});
  return NextResponse.json(value);
}

export async function PUT(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const patch = (await req.json()) as Record<string, unknown>;
  const supabase = createServerSupabase();
  const { data: row } = await supabase
    .from("settings")
    .select("value")
    .eq("key", PRICING_KEY)
    .maybeSingle();
  const value = mergePricing(row?.value as Record<string, unknown> | undefined, patch);
  const { error } = await supabase
    .from("settings")
    .upsert({ key: PRICING_KEY, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) {
    console.error("[admin/settings PUT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
