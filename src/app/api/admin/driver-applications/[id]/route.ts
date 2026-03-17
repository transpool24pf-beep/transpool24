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
  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const supabase = createServerSupabase();
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
    const { error: updateErr } = await supabase
      .from("driver_applications")
      .update({ status: "approved", approved_at: now, updated_at: now })
      .eq("id", id);
    if (updateErr) {
      console.error("[admin/driver-applications PATCH approve]", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, status: "approved" });
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
