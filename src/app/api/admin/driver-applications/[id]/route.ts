import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { sendDriverApprovalEmail } from "@/lib/email";
import { generateDriverApprovalPdf } from "@/lib/driver-approval-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("driver_applications")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, order_number, driver_price_cents, customer_driver_rating, created_at, logistics_status, pickup_address, delivery_address, company_name")
    .eq("assigned_driver_application_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  const jobs_count = jobs?.length ?? 0;
  const total_paid_cents = (jobs ?? []).reduce((s, j) => s + (Number(j.driver_price_cents) || 0), 0);
  const ratings = (jobs ?? []).filter((j) => (j as { customer_driver_rating?: number }).customer_driver_rating != null) as { customer_driver_rating: number }[];
  const customer_rating_avg =
    ratings.length > 0
      ? ratings.reduce((s, j) => s + j.customer_driver_rating, 0) / ratings.length
      : null;
  const last_jobs = (jobs ?? []).map((j) => ({
    id: j.id,
    order_number: j.order_number,
    created_at: j.created_at,
    logistics_status: j.logistics_status,
    pickup_address: j.pickup_address,
    delivery_address: j.delivery_address,
    company_name: j.company_name,
    driver_price_cents: j.driver_price_cents,
    customer_driver_rating: (j as { customer_driver_rating?: number }).customer_driver_rating,
  }));
  return NextResponse.json({
    ...data,
    stats: { jobs_count, total_paid_cents, customer_rating_avg },
    last_jobs,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  const body = await req.json();
  const action = body?.action as string;
  if (
    !action ||
    !["approve", "reject", "assign_number", "suspend", "unsuspend", "update_desired_note", "update_star_rating"].includes(action)
  ) {
    return NextResponse.json(
      { error: "action must be approve, reject, assign_number, suspend, unsuspend, update_desired_note, or update_star_rating" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabase();

  if (action === "suspend" || action === "unsuspend") {
    const { error: updateErr } = await supabase
      .from("driver_applications")
      .update({
        suspended_at: action === "suspend" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, suspended: action === "suspend" });
  }

  if (action === "update_desired_note" || action === "update_star_rating") {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (action === "update_desired_note" && body.desired_note !== undefined) {
      updates.desired_note = typeof body.desired_note === "string" ? body.desired_note.trim() : null;
    }
    if (action === "update_star_rating" && body.star_rating !== undefined) {
      const v = body.star_rating;
      updates.star_rating = v === null || v === "" ? null : Math.min(5, Math.max(0, Number(v)));
    }
    const { error: updateErr } = await supabase
      .from("driver_applications")
      .update(updates)
      .eq("id", id);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "assign_number") {
    const { data: app, error: fetchErr } = await supabase
      .from("driver_applications")
      .select("id, status, driver_number")
      .eq("id", id)
      .single();
    if (fetchErr || !app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (app.status !== "approved") {
      return NextResponse.json({ error: "Only approved applications can get a driver number" }, { status: 400 });
    }
    if (app.driver_number != null) {
      return NextResponse.json({ ok: true, driver_number: app.driver_number });
    }
    const { data: maxRows } = await supabase
      .from("driver_applications")
      .select("driver_number")
      .gte("driver_number", 10000)
      .order("driver_number", { ascending: false })
      .limit(1);
    const nextNumber = (maxRows?.[0]?.driver_number ?? 10000) + 1;
    const { data: updated, error: updateErr } = await supabase
      .from("driver_applications")
      .update({ driver_number: nextNumber, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("driver_number")
      .single();
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, driver_number: updated?.driver_number ?? nextNumber });
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("driver_applications")
    .select("id, status")
    .eq("id", id)
    .single();
  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status !== "new") {
    return NextResponse.json({ error: "Application already processed" }, { status: 400 });
  }

  const now = new Date().toISOString();
  if (action === "approve") {
    const { data: maxRows } = await supabase
      .from("driver_applications")
      .select("driver_number")
      .gte("driver_number", 10000)
      .order("driver_number", { ascending: false })
      .limit(1);
    const nextNumber = (maxRows?.[0]?.driver_number ?? 10000) + 1;
    const { data: updated, error: updateErr } = await supabase
      .from("driver_applications")
      .update({
        status: "approved",
        approved_at: now,
        driver_number: nextNumber,
        updated_at: now,
      })
      .eq("id", id)
      .select("driver_number")
      .single();
    if (updateErr) {
      console.error("[admin/driver-applications PATCH approve]", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    const driverNumber = updated?.driver_number ?? nextNumber;
    const { data: appRow } = await supabase
      .from("driver_applications")
      .select("full_name, email, approved_at, vehicle_plate, personal_photo_url")
      .eq("id", id)
      .single();
    if (appRow?.email?.trim()) {
      const whatsAppLink = process.env.TRANSPOOL24_WHATSAPP_GROUP_LINK || "https://chat.whatsapp.com/IUQkN7Xvo9D68XgT8WRPW5?mode=gi_t";
      let pdfBuffer: Uint8Array | undefined;
      try {
        pdfBuffer = await generateDriverApprovalPdf({
          full_name: String(appRow.full_name ?? ""),
          email: String(appRow.email ?? ""),
          phone: "",
          city: "",
          vehicle_plate: appRow.vehicle_plate ?? null,
          languages_spoken: null,
          approved_at: appRow.approved_at ?? now,
          driver_number: driverNumber,
        });
      } catch (e) {
        console.warn("[approve] PDF skip", e);
      }
      const sent = await sendDriverApprovalEmail(
        appRow.email.trim(),
        {
          full_name: String(appRow.full_name ?? ""),
          email: String(appRow.email ?? ""),
          driver_number: driverNumber,
          approved_at: appRow.approved_at ?? now,
          vehicle_plate: appRow.vehicle_plate ?? null,
          personal_photo_url: appRow.personal_photo_url ?? null,
        },
        { whatsAppLink, pdfBuffer }
      );
      if (!sent.success) console.warn("[approve] Email not sent:", sent.error);
    }
    return NextResponse.json({
      ok: true,
      status: "approved",
      driver_number: driverNumber,
    });
  }

  // reject
  const rejection_notes = typeof body.rejection_notes === "string" ? body.rejection_notes.trim() : "";
  if (!rejection_notes) {
    return NextResponse.json({ error: "rejection_notes required when rejecting" }, { status: 400 });
  }
  const rejection_image_urls = Array.isArray(body.rejection_image_urls)
    ? body.rejection_image_urls.filter((u: unknown) => typeof u === "string")
    : [];
  const { error: updateErr } = await supabase
    .from("driver_applications")
    .update({
      status: "rejected",
      rejected_at: now,
      rejection_notes,
      rejection_image_urls: rejection_image_urls,
      updated_at: now,
    })
    .eq("id", id);
  if (updateErr) {
    console.error("[admin/driver-applications PATCH reject]", updateErr);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, status: "rejected" });
}
