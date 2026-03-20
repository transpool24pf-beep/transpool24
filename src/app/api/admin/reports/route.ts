import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

/** Simple aggregates for admin dashboard (extend with more queries later) */
export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const supabase = createServerSupabase();
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      "id, order_number, company_name, price_cents, logistics_status, payment_status, created_at, assigned_driver_application_id"
    );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const list = jobs ?? [];
  const totalOrders = list.length;
  const revenueCents = list.filter((j) => j.logistics_status !== "cancelled" && j.logistics_status !== "draft").reduce((s, j) => s + (j.price_cents ?? 0), 0);
  const byStatus: Record<string, number> = {};
  for (const j of list) {
    const st = j.logistics_status ?? "unknown";
    byStatus[st] = (byStatus[st] ?? 0) + 1;
  }
  const assignedCount = list.filter((j) => j.assigned_driver_application_id != null).length;
  const deliveredCount = list.filter((j) => j.logistics_status === "delivered").length;
  const cancelledCount = list.filter((j) => j.logistics_status === "cancelled").length;
  const paidJobs = list.filter(
    (j) => j.payment_status === "paid" && j.logistics_status !== "cancelled"
  );
  const paidOrderCount = paidJobs.length;
  const paidRevenueCents = paidJobs.reduce((s, j) => s + (j.price_cents ?? 0), 0);
  const byPayment: Record<string, number> = {};
  for (const j of list) {
    const ps = j.payment_status ?? "unknown";
    byPayment[ps] = (byPayment[ps] ?? 0) + 1;
  }
  const paidInvoices = paidJobs
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 100)
    .map((j) => ({
      id: j.id,
      order_number: j.order_number,
      company_name: j.company_name ?? "",
      price_cents: j.price_cents ?? 0,
      created_at: j.created_at,
    }));
  return NextResponse.json({
    totalOrders,
    revenueEur: (revenueCents / 100).toFixed(2),
    byStatus,
    assignedCount,
    deliveredCount,
    cancelledCount,
    cancelRatePercent: totalOrders > 0 ? ((cancelledCount / totalOrders) * 100).toFixed(1) : "0",
    paidOrderCount,
    paidRevenueEur: (paidRevenueCents / 100).toFixed(2),
    byPayment,
    paidInvoices,
  });
}
