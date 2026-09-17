import { NextResponse } from "next/server";
import { createServerSupabase, isMissingDbColumn } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { formatCargoLoadsPlainDe } from "@/lib/cargo";
import { formatAuftragNumber } from "@/lib/order-ref";
import {
  formatStructuredAddressPlain,
  jobPreferredDeliveryAt,
  jobRecipientAddress,
  jobSenderAddress,
} from "@/lib/structured-address";
import { driverPayoutCents } from "@/lib/job-status-automation";

/** Simple aggregates for admin dashboard (extend with more queries later) */
export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const supabase = createServerSupabase();
  const reportSelect =
    "id, order_number, company_name, phone, customer_email, pickup_address, delivery_address, cargo_size, cargo_details, distance_km, price_cents, driver_price_cents, logistics_status, payment_status, created_at, preferred_pickup_at, assigned_driver_application_id, pod_completed_at, archived_at";
  const reportSelectWithoutArchive =
    "id, order_number, company_name, phone, customer_email, pickup_address, delivery_address, cargo_size, cargo_details, distance_km, price_cents, driver_price_cents, logistics_status, payment_status, created_at, preferred_pickup_at, assigned_driver_application_id, pod_completed_at";
  const first = await supabase.from("jobs").select(reportSelect);
  const used =
    first.error && isMissingDbColumn(first.error, "archived_at")
      ? await supabase.from("jobs").select(reportSelectWithoutArchive)
      : first;
  if (used.error) {
    return NextResponse.json({ error: used.error.message }, { status: 500 });
  }
  const list = (used.data ?? []) as Array<{
    id: string;
    order_number: number | null;
    company_name: string | null;
    phone: string | null;
    customer_email: string | null;
    pickup_address: string | null;
    delivery_address: string | null;
    cargo_size: string | null;
    cargo_details: unknown;
    distance_km: number | null;
    price_cents: number | null;
    driver_price_cents: number | null;
    logistics_status: string | null;
    payment_status: string | null;
    created_at: string;
    preferred_pickup_at: string | null;
    assigned_driver_application_id: string | null;
    pod_completed_at: string | null;
    archived_at?: string | null;
  }>;
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
  const inTransitCount = list.filter((j) => j.logistics_status === "in_transit").length;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: supportCount, error: supErr } = await supabase
    .from("support_requests")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if (supErr) {
    console.warn("[admin/reports] support_requests count", supErr.message);
  }
  const supportTickets7d = supErr ? 0 : supportCount ?? 0;
  const appIds = [
    ...new Set(
      list
        .map((j) => j.assigned_driver_application_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];
  const driverNumberByAppId = new Map<string, number>();
  if (appIds.length > 0) {
    const { data: drivers } = await supabase
      .from("driver_applications")
      .select("id, driver_number")
      .in("id", appIds);
    for (const d of drivers ?? []) {
      const id = (d as { id?: string }).id;
      const num = (d as { driver_number?: number | null }).driver_number;
      if (id && num != null) driverNumberByAppId.set(id, Number(num));
    }
  }
  const archiveOrders = list
    .filter((j) => j.logistics_status !== "draft")
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((j) => {
      const cargo_details =
        j.cargo_details && typeof j.cargo_details === "object" && !Array.isArray(j.cargo_details)
          ? (j.cargo_details as Record<string, unknown>)
          : null;
      const jobLike = { ...j, cargo_details };
      const sender = jobSenderAddress(jobLike);
      const recipient = jobRecipientAddress(jobLike);
      return {
        id: j.id,
        auftrag: formatAuftragNumber(j),
        order_number: j.order_number,
        company_name: j.company_name ?? "",
        phone: j.phone ?? "",
        customer_email: j.customer_email ?? "",
        pickup: formatStructuredAddressPlain(sender) || j.pickup_address || "",
        delivery: formatStructuredAddressPlain(recipient) || j.delivery_address || "",
        recipient_phone: recipient.phone ?? "",
        pickup_at: j.preferred_pickup_at ?? null,
        delivery_at: jobPreferredDeliveryAt(jobLike),
        cargo_size: j.cargo_size ?? "",
        loads: formatCargoLoadsPlainDe(cargo_details) || "",
        distance_km: j.distance_km,
        price_cents: j.price_cents ?? 0,
        driver_price_cents: j.driver_price_cents ?? null,
        payment_status: j.payment_status ?? "",
        logistics_status: j.logistics_status ?? "",
        created_at: j.created_at,
        pod_completed_at: j.pod_completed_at ?? null,
        has_driver: j.assigned_driver_application_id != null,
        hidden_from_orders: Boolean((j as { archived_at?: string | null }).archived_at),
        driver_number: j.assigned_driver_application_id
          ? driverNumberByAppId.get(j.assigned_driver_application_id) ?? null
          : null,
        driver_payout_cents: driverPayoutCents(j),
      };
    });
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
    inTransitCount,
    supportTickets7d,
    archiveOrders,
  });
}
