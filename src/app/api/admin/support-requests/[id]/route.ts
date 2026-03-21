import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const body = await request.json();
    const admin_reply = typeof body?.admin_reply === "string" ? body.admin_reply : null;
    if (admin_reply === null) {
      return NextResponse.json({ error: "admin_reply required" }, { status: 400 });
    }
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("support_requests")
      .update({ admin_reply })
      .eq("id", id)
      .select("id, admin_reply")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, request: data });
  } catch (e) {
    console.error("[admin/support-requests PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
