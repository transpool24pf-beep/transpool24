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
