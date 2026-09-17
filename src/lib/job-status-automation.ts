import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingDbColumn } from "@/lib/supabase";

const TERMINAL = new Set(["delivered", "cancelled", "draft"]);

export function driverPayoutCents(job: {
  driver_price_cents?: number | null;
  distance_km?: number | null;
}): number {
  const stored = job.driver_price_cents;
  if (stored != null && Number.isFinite(Number(stored)) && Number(stored) > 0) {
    return Math.round(Number(stored));
  }
  const km = job.distance_km;
  if (km != null && Number.isFinite(Number(km)) && Number(km) > 0) {
    return Math.round(18 * Number(km) * 2);
  }
  return 0;
}

export async function markJobInTransitIfActive(
  supabase: SupabaseClient,
  jobId: string
): Promise<{ logistics_status: string }> {
  const { data: job, error } = await supabase
    .from("jobs")
    .select("logistics_status")
    .eq("id", jobId)
    .maybeSingle();
  if (error || !job) {
    return { logistics_status: "in_transit" };
  }
  const st = String(job.logistics_status ?? "");
  if (TERMINAL.has(st) || st === "in_transit") {
    return { logistics_status: st || "in_transit" };
  }
  const now = new Date().toISOString();
  const { error: upErr } = await supabase
    .from("jobs")
    .update({ logistics_status: "in_transit", updated_at: now })
    .eq("id", jobId);
  if (upErr) {
    console.error("[markJobInTransitIfActive]", upErr);
    return { logistics_status: st };
  }
  return { logistics_status: "in_transit" };
}

type DeliveryExtras = {
  pod_photo_url?: string;
  pod_completed_at?: string;
};

/** Mark delivered, hide from orders list, credit assigned driver (once). */
export async function completeDeliveredJob(
  supabase: SupabaseClient,
  jobId: string,
  extras?: DeliveryExtras
): Promise<{ ok: boolean; message?: string; logistics_status?: string }> {
  const { data: job, error: fetchErr } = await supabase
    .from("jobs")
    .select(
      "id, logistics_status, archived_at, pod_completed_at, pod_photo_url, assigned_driver_application_id, driver_price_cents, distance_km, driver_payout_credited_at"
    )
    .eq("id", jobId)
    .maybeSingle();

  let row = job as
    | {
        id: string;
        logistics_status: string | null;
        archived_at?: string | null;
        pod_completed_at?: string | null;
        pod_photo_url?: string | null;
        assigned_driver_application_id?: string | null;
        driver_price_cents?: number | null;
        distance_km?: number | null;
        driver_payout_credited_at?: string | null;
      }
    | null;

  if (fetchErr && isMissingDbColumn(fetchErr, "driver_payout_credited_at")) {
    const retry = await supabase
      .from("jobs")
      .select(
        "id, logistics_status, archived_at, pod_completed_at, pod_photo_url, assigned_driver_application_id, driver_price_cents, distance_km"
      )
      .eq("id", jobId)
      .maybeSingle();
    if (retry.error || !retry.data) {
      return { ok: false, message: retry.error?.message ?? "Order not found" };
    }
    row = retry.data as typeof row;
  } else if (fetchErr || !row) {
    return { ok: false, message: fetchErr?.message ?? "Order not found" };
  }

  if (!row) return { ok: false, message: "Order not found" };
  if (row.logistics_status === "cancelled") {
    return { ok: true, logistics_status: "cancelled" };
  }

  const now = new Date().toISOString();
  const payout = driverPayoutCents(row);
  const alreadyCredited = Boolean(row.driver_payout_credited_at);
  const updates: Record<string, unknown> = {
    logistics_status: "delivered",
    archived_at: row.archived_at ?? now,
    pod_completed_at: extras?.pod_completed_at ?? row.pod_completed_at ?? now,
    updated_at: now,
  };
  if (extras?.pod_photo_url) updates.pod_photo_url = extras.pod_photo_url;
  if (!alreadyCredited && payout > 0 && row.assigned_driver_application_id) {
    updates.driver_payout_credited_at = now;
  }

  let { error: upErr } = await supabase.from("jobs").update(updates).eq("id", jobId);
  if (upErr && isMissingDbColumn(upErr, "driver_payout_credited_at")) {
    const withoutCredit = { ...updates };
    delete withoutCredit.driver_payout_credited_at;
    const retry = await supabase.from("jobs").update(withoutCredit).eq("id", jobId);
    upErr = retry.error;
  }
  if (upErr && isMissingDbColumn(upErr, "archived_at")) {
    const withoutArchive = { ...updates };
    delete withoutArchive.archived_at;
    delete withoutArchive.driver_payout_credited_at;
    const retry = await supabase.from("jobs").update(withoutArchive).eq("id", jobId);
    upErr = retry.error;
  }
  if (upErr) {
    console.error("[completeDeliveredJob] job update", upErr);
    return { ok: false, message: upErr.message };
  }

  if (!alreadyCredited && payout > 0 && row.assigned_driver_application_id) {
    const appId = row.assigned_driver_application_id;
    const { data: drv, error: dErr } = await supabase
      .from("driver_applications")
      .select("id, payable_balance_cents")
      .eq("id", appId)
      .maybeSingle();
    if (!dErr && drv) {
      const current = Number((drv as { payable_balance_cents?: number }).payable_balance_cents ?? 0) || 0;
      const { error: balErr } = await supabase
        .from("driver_applications")
        .update({ payable_balance_cents: current + payout, updated_at: now })
        .eq("id", appId);
      if (balErr && !isMissingDbColumn(balErr, "payable_balance_cents")) {
        console.error("[completeDeliveredJob] driver balance", balErr);
      }
    }
  }

  return { ok: true, logistics_status: "delivered" };
}
