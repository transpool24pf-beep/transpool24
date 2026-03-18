import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("support_requests")
    .select("id, driver_number, name, email, message, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[admin/support-requests]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
