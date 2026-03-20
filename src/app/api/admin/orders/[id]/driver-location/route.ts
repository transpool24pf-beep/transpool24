import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";

/** POST: record driver GPS for a job + update jobs.last_driver_* */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id: jobId } = await params;
  if (!jobId) return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const lat = typeof body.latitude === "number" ? body.latitude : Number(body.lat);
  const lng = typeof body.longitude === "number" ? body.longitude : Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Invalid latitude/longitude" }, { status: 400 });
  }
  const supabase = createServerSupabase();
  const now = new Date().toISOString();
  const { error: insErr } = await supabase.from("driver_location_updates").insert({
    job_id: jobId,
    latitude: lat,
    longitude: lng,
    recorded_at: now,
    accuracy_m: body.accuracy_m != null ? Number(body.accuracy_m) : null,
    heading: body.heading != null ? Number(body.heading) : null,
  });
  if (insErr) {
    console.error("[driver-location]", insErr);
    return NextResponse.json(
      { error: insErr.message, hint: "Run supabase/roadmap_foundation.sql if table missing" },
      { status: 500 }
    );
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
    console.error("[driver-location job update]", upErr);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, recorded_at: now });
}
