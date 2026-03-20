import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

/**
 * Public tracking (no auth): job_id + confirmation_token must match.
 * Returns status, ETA fields, last position, recent trail, stops (no sensitive POD URLs).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("job_id");
  const token = searchParams.get("token");
  if (!jobId || !token) {
    return NextResponse.json({ error: "job_id and token required" }, { status: 400 });
  }
  const supabase = createServerSupabase();
  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select(
      "id, order_number, logistics_status, pickup_address, delivery_address, estimated_arrival_at, eta_minutes_remaining, last_driver_lat, last_driver_lng, last_driver_location_at, pod_completed_at, confirmation_token"
    )
    .eq("id", jobId)
    .single();
  if (jobErr || !job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (job.confirmation_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }
  const { data: trail, error: trailErr } = await supabase
    .from("driver_location_updates")
    .select("latitude, longitude, recorded_at")
    .eq("job_id", jobId)
    .order("recorded_at", { ascending: false })
    .limit(30);
  if (trailErr) {
    console.warn("[order-tracking] driver_location_updates:", trailErr.message);
  }
  const { data: stops, error: stopsErr } = await supabase
    .from("job_stops")
    .select("sequence_order, address, city, latitude, longitude, completed_at")
    .eq("job_id", jobId)
    .order("sequence_order", { ascending: true });
  if (stopsErr) {
    console.warn("[order-tracking] job_stops:", stopsErr.message);
  }
  const { confirmation_token: _ignored, ...safeJob } = job as Record<string, unknown>;
  return NextResponse.json({
    job: safeJob,
    trail: trailErr ? [] : trail ?? [],
    stops: stopsErr ? [] : stops ?? [],
    delivered: Boolean(job.pod_completed_at),
  });
}
