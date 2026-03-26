import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

/**
 * Attention sets for admin sidebar badges (IDs only).
 * Orders: unpaid / failed payment or early logistics (draft, confirmed).
 * Drivers: applications still in "new".
 * Support: requests with no admin reply yet.
 */
export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const supabase = createServerSupabase();

  const { data: jobs, error: jobsErr } = await supabase
    .from("jobs")
    .select("id")
    .or("payment_status.eq.pending,payment_status.eq.failed,logistics_status.eq.draft,logistics_status.eq.confirmed");
  if (jobsErr) {
    console.error("[admin/notifications jobs]", jobsErr);
    return NextResponse.json({ error: jobsErr.message }, { status: 500 });
  }

  const { data: apps, error: appsErr } = await supabase
    .from("driver_applications")
    .select("id")
    .eq("status", "new");
  if (appsErr) {
    console.error("[admin/notifications driver_applications]", appsErr);
    return NextResponse.json({ error: appsErr.message }, { status: 500 });
  }

  const { data: supportRows, error: supErr } = await supabase
    .from("support_requests")
    .select("id, admin_reply");
  if (supErr) {
    console.error("[admin/notifications support_requests]", supErr);
    return NextResponse.json({ error: supErr.message }, { status: 500 });
  }

  const orderIds = [...new Set((jobs ?? []).map((r) => String(r.id)))];
  const driverIds = [...new Set((apps ?? []).map((r) => String(r.id)))];
  const supportIds = (supportRows ?? [])
    .filter((r) => r.admin_reply == null || String(r.admin_reply).trim() === "")
    .map((r) => String(r.id));

  return NextResponse.json({
    orderAttentionIds: orderIds,
    driverApplicationIds: driverIds,
    supportOpenIds: [...new Set(supportIds)],
  });
}
