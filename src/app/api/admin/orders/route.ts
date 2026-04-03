import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, order_number, company_name, phone, customer_email, pickup_address, delivery_address, cargo_size, cargo_details, service_type, distance_km, duration_minutes, price_cents, driver_price_cents, assistant_price_cents, payment_status, logistics_status, created_at, preferred_pickup_at, confirmation_token, assigned_driver_application_id, estimated_arrival_at, eta_minutes_remaining, last_driver_location_at, pod_photo_url, pod_completed_at"
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[admin/orders]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rows = data ?? [];
  const appIds = [
    ...new Set(
      rows
        .map((j) => (j as { assigned_driver_application_id?: string | null }).assigned_driver_application_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  const driverByAppId = new Map<string, { phone: string; full_name: string | null }>();
  if (appIds.length > 0) {
    const { data: drivers, error: dErr } = await supabase
      .from("driver_applications")
      .select("id, phone, full_name")
      .in("id", appIds);
    if (dErr) {
      console.error("[admin/orders] driver phones", dErr);
    } else {
      for (const d of drivers ?? []) {
        const id = (d as { id?: string }).id;
        const phone = String((d as { phone?: string | null }).phone ?? "").trim();
        const fullName = String((d as { full_name?: string | null }).full_name ?? "").trim() || null;
        if (id) driverByAppId.set(id, { phone, full_name: fullName });
      }
    }
  }
  const enriched = rows.map((j) => {
    const aid = (j as { assigned_driver_application_id?: string | null }).assigned_driver_application_id;
    const dr = aid ? driverByAppId.get(aid) : undefined;
    const p = dr?.phone ? dr.phone : null;
    const n = dr?.full_name ?? null;
    return { ...j, driver_whatsapp_phone: p || null, driver_whatsapp_full_name: n };
  });
  return NextResponse.json(enriched);
}

export async function PATCH(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const body = await req.json();
  const { id, logistics_status, assigned_driver_id, assigned_driver_application_id } = body;
  if (!id) return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  const supabase = createServerSupabase();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (logistics_status != null) updates.logistics_status = logistics_status;
  if (assigned_driver_id !== undefined) updates.assigned_driver_id = assigned_driver_id || null;
  if (assigned_driver_application_id !== undefined) updates.assigned_driver_application_id = assigned_driver_application_id || null;
  if (body.driver_price_cents !== undefined) updates.driver_price_cents = body.driver_price_cents == null ? null : Number(body.driver_price_cents);
  if (body.assistant_price_cents !== undefined) {
    updates.assistant_price_cents =
      body.assistant_price_cents == null ? null : Number(body.assistant_price_cents);
  }
  if (body.payment_status !== undefined) {
    const ps = String(body.payment_status);
    if (!["pending", "paid", "refunded", "failed"].includes(ps)) {
      return NextResponse.json({ error: "Invalid payment_status" }, { status: 400 });
    }
    updates.payment_status = ps;
  }
  // ETA / POD / tracking (roadmap_foundation.sql)
  if (body.estimated_arrival_at !== undefined) updates.estimated_arrival_at = body.estimated_arrival_at || null;
  if (body.eta_minutes_remaining !== undefined) {
    updates.eta_minutes_remaining =
      body.eta_minutes_remaining == null || body.eta_minutes_remaining === ""
        ? null
        : Number(body.eta_minutes_remaining);
  }
  if (body.pod_photo_url !== undefined) updates.pod_photo_url = body.pod_photo_url || null;
  if (body.pod_signature_url !== undefined) updates.pod_signature_url = body.pod_signature_url || null;
  if (body.pod_confirmation_code !== undefined) updates.pod_confirmation_code = body.pod_confirmation_code || null;
  if (body.pod_completed_at !== undefined) updates.pod_completed_at = body.pod_completed_at || null;
  if (body.last_driver_lat !== undefined) updates.last_driver_lat = body.last_driver_lat == null ? null : Number(body.last_driver_lat);
  if (body.last_driver_lng !== undefined) updates.last_driver_lng = body.last_driver_lng == null ? null : Number(body.last_driver_lng);
  if (body.last_driver_location_at !== undefined) updates.last_driver_location_at = body.last_driver_location_at || null;
  if (body.customer_review_published !== undefined) {
    const pub = Boolean(body.customer_review_published);
    const { data: ratedJob, error: ratedErr } = await supabase
      .from("jobs")
      .select("id, customer_driver_rating")
      .eq("id", id)
      .single();
    if (ratedErr || !ratedJob) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (ratedJob.customer_driver_rating == null) {
      return NextResponse.json({ error: "No customer rating to publish" }, { status: 400 });
    }
    updates.customer_review_published = pub;
  }
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
