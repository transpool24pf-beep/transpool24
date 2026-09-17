import { NextResponse } from "next/server";
import { createServerSupabase, isMissingDbColumn } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  const supabase = createServerSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("jobs")
    .update({ archived_at: now, updated_at: now })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[admin/orders DELETE]", error);
    return NextResponse.json(
      {
        error: isMissingDbColumn(error, "archived_at")
          ? "Missing column jobs.archived_at. Run supabase/add_jobs_archived_at.sql in Supabase SQL Editor."
          : error.message,
      },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
