import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .select("id, company_name, phone, customer_email, pickup_address, delivery_address, cargo_size, distance_km, price_cents, payment_status, logistics_status, created_at, preferred_pickup_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[admin/orders]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const body = await req.json();
  const { id, logistics_status, assigned_driver_id } = body;
  if (!id) return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  const supabase = createServerSupabase();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (logistics_status != null) updates.logistics_status = logistics_status;
  if (assigned_driver_id !== undefined) updates.assigned_driver_id = assigned_driver_id || null;
  const { data, error } = await supabase
    .from("jobs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("[admin/orders PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
