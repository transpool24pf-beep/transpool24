import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase";
import { recordDriverLocationForJob } from "@/lib/record-driver-location";

/**
 * Driver shares GPS using job_id + driver_tracking_token (from admin link).
 * GET: validate token, return minimal job info for UI.
 * POST: record position (same as admin driver-location, no admin cookie).
 */
export async function GET(req: Request) {
  const limited = rateLimitResponse(req, "publicDriver");
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("job_id");
  const token = searchParams.get("token");
  if (!jobId || !token) {
    return NextResponse.json({ error: "job_id and token required" }, { status: 400 });
  }
  const supabase = createServerSupabase();
  const { data: job, error } = await supabase
    .from("jobs")
    .select(
      "id, order_number, logistics_status, pickup_address, delivery_address, driver_tracking_token, distance_km, duration_minutes, pod_photo_url, pod_completed_at, last_driver_location_at"
    )
    .eq("id", jobId)
    .maybeSingle();
  if (error || !job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!job.driver_tracking_token || job.driver_tracking_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }
  const deliveryComplete =
    Boolean(job.pod_completed_at) || job.logistics_status === "delivered";
  const hasLiveLocation = Boolean(job.last_driver_location_at);
  return NextResponse.json({
    ok: true,
    order_number: job.order_number,
    logistics_status: job.logistics_status,
    pickup_address: job.pickup_address,
    delivery_address: job.delivery_address,
    distance_km: job.distance_km ?? null,
    duration_minutes: job.duration_minutes ?? null,
    pod_photo_url: job.pod_photo_url ?? null,
    pod_completed_at: job.pod_completed_at ?? null,
    delivery_complete: deliveryComplete,
    last_driver_location_at: job.last_driver_location_at ?? null,
    has_live_location: hasLiveLocation,
  });
}

export async function POST(req: Request) {
  const limited = rateLimitResponse(req, "publicDriver");
  if (limited) return limited;
  const body = await req.json().catch(() => ({}));
  const jobId = typeof body.job_id === "string" ? body.job_id : null;
  const token = typeof body.token === "string" ? body.token : null;
  const lat = typeof body.latitude === "number" ? body.latitude : Number(body.lat);
  const lng = typeof body.longitude === "number" ? body.longitude : Number(body.lng);
  if (!jobId || !token) {
    return NextResponse.json({ error: "job_id and token required" }, { status: 400 });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Invalid latitude/longitude" }, { status: 400 });
  }
  const supabase = createServerSupabase();
  const { data: job, error: fetchErr } = await supabase
    .from("jobs")
    .select("id, driver_tracking_token")
    .eq("id", jobId)
    .maybeSingle();
  if (fetchErr || !job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!job.driver_tracking_token || job.driver_tracking_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }
  const result = await recordDriverLocationForJob(supabase, jobId, lat, lng, {
    accuracy_m: body.accuracy_m != null ? Number(body.accuracy_m) : null,
    heading: body.heading != null ? Number(body.heading) : null,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, hint: "Run supabase/add_driver_tracking_token.sql and roadmap_foundation.sql" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, recorded_at: result.recorded_at });
}
