import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

const PRICING_KEY = "pricing";

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
  const value = (data?.value as Record<string, unknown>) ?? {
    price_per_km_cents: { XS: 80, M: 120, L: 200 },
    driver_hourly_rate_cents: 2500,
  };
  return NextResponse.json(value);
}

export async function PUT(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const value = await req.json();
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("settings")
    .upsert({ key: PRICING_KEY, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) {
    console.error("[admin/settings PUT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
