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
  const { error: upErr } = await supabase
    .from("jobs")
    .update({
      last_driver_lat: lat,
      last_driver_lng: lng,
      last_driver_location_at: now,
      updated_at: now,
    })
    .eq("id", jobId);
  if (upErr) {
    console.error("[recordDriverLocationForJob] job update", upErr);
    return { ok: false, message: upErr.message };
  }
  return { ok: true, recorded_at: now };
}
