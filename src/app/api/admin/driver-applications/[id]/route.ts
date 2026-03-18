import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

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
  return NextResponse.json(data);
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
  if (!action || !["approve", "reject", "assign_number"].includes(action)) {
    return NextResponse.json({ error: "action must be approve, reject, or assign_number" }, { status: 400 });
  }

  const supabase = createServerSupabase();

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
      .not("driver_number", "is", null)
      .order("driver_number", { ascending: false })
      .limit(1);
    const nextNumber = (maxRows?.[0]?.driver_number ?? 0) + 1;
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
      .not("driver_number", "is", null)
      .order("driver_number", { ascending: false })
      .limit(1);
    const nextNumber = (maxRows?.[0]?.driver_number ?? 0) + 1;
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
    return NextResponse.json({
      ok: true,
      status: "approved",
      driver_number: updated?.driver_number ?? nextNumber,
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
