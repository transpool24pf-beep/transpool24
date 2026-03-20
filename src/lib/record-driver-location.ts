import type { SupabaseClient } from "@supabase/supabase-js";

/** Insert GPS point + update jobs.last_driver_* (service role). */
export async function recordDriverLocationForJob(
  supabase: SupabaseClient,
  jobId: string,
  lat: number,
  lng: number,
  opts?: { accuracy_m?: number | null; heading?: number | null }
): Promise<{ ok: true; recorded_at: string } | { ok: false; message: string }> {
  const now = new Date().toISOString();

  const { data: jobRow, error: jobFetchErr } = await supabase
    .from("jobs")
    .select(
      "logistics_status, estimated_arrival_at, eta_minutes_remaining, duration_minutes"
    )
    .eq("id", jobId)
    .maybeSingle();

  if (jobFetchErr) {
    console.error("[recordDriverLocationForJob] job fetch", jobFetchErr);
    return { ok: false, message: jobFetchErr.message };
  }

  const { error: insErr } = await supabase.from("driver_location_updates").insert({
    job_id: jobId,
    latitude: lat,
    longitude: lng,
    recorded_at: now,
    accuracy_m: opts?.accuracy_m != null && Number.isFinite(Number(opts.accuracy_m)) ? Number(opts.accuracy_m) : null,
    heading: opts?.heading != null && Number.isFinite(Number(opts.heading)) ? Number(opts.heading) : null,
  });
  if (insErr) {
    console.error("[recordDriverLocationForJob] insert", insErr);
    return { ok: false, message: insErr.message };
  }

  const jobUpdate: Record<string, unknown> = {
    last_driver_lat: lat,
    last_driver_lng: lng,
    last_driver_location_at: now,
    updated_at: now,
  };

  if (jobRow) {
    const st = jobRow.logistics_status ?? "";
    if (st === "assigned" || st === "paid" || st === "confirmed") {
      jobUpdate.logistics_status = "in_transit";
    }
    const noEta =
      jobRow.estimated_arrival_at == null && jobRow.eta_minutes_remaining == null;
    const dm =
      typeof jobRow.duration_minutes === "number" && jobRow.duration_minutes > 0
        ? jobRow.duration_minutes
        : null;
    if (noEta && dm != null) {
      jobUpdate.eta_minutes_remaining = dm;
      const arrival = new Date();
      arrival.setMinutes(arrival.getMinutes() + dm);
      jobUpdate.estimated_arrival_at = arrival.toISOString();
    }
  }

  const { error: upErr } = await supabase.from("jobs").update(jobUpdate).eq("id", jobId);
  if (upErr) {
    console.error("[recordDriverLocationForJob] job update", upErr);
    return { ok: false, message: upErr.message };
  }
  return { ok: true, recorded_at: now };
}
