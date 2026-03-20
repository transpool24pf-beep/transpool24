import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { geocodeAddressForMap } from "@/lib/route-distance-server";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

async function fetchOsrmLine(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): Promise<GeoJSON.LineString | null> {
  try {
    const res = await fetch(
      `${OSRM_URL}/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`,
      { cache: "no-store" }
    );
    const data = (await res.json()) as {
      code?: string;
      routes?: { geometry?: GeoJSON.LineString }[];
    };
    if (data.code !== "Ok" || !data.routes?.[0]?.geometry) return null;
    return data.routes[0].geometry;
  } catch {
    return null;
  }
}

/**
 * Public tracking (no auth): job_id + confirmation_token must match.
 * Returns status, ETA, driver summary, planned route (geocoded), trail, stops.
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
      "id, order_number, logistics_status, pickup_address, delivery_address, estimated_arrival_at, eta_minutes_remaining, last_driver_lat, last_driver_lng, last_driver_location_at, pod_completed_at, confirmation_token, assigned_driver_application_id, distance_km"
    )
    .eq("id", jobId)
    .single();
  if (jobErr || !job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (job.confirmation_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const driverAppId = job.assigned_driver_application_id as string | null | undefined;

  const [trailRes, stopsRes, driverRes] = await Promise.all([
    supabase
      .from("driver_location_updates")
      .select("latitude, longitude, recorded_at")
      .eq("job_id", jobId)
      .order("recorded_at", { ascending: false })
      .limit(40),
    supabase
      .from("job_stops")
      .select("sequence_order, address, city, latitude, longitude, completed_at")
      .eq("job_id", jobId)
      .order("sequence_order", { ascending: true }),
    driverAppId
      ? supabase
          .from("driver_applications")
          .select("full_name, phone, vehicle_plate, languages_spoken, personal_photo_url, star_rating")
          .eq("id", driverAppId)
          .maybeSingle()
      : Promise.resolve({ data: null as null, error: null }),
  ]);

  if (trailRes.error) {
    console.warn("[order-tracking] driver_location_updates:", trailRes.error.message);
  }
  if (stopsRes.error) {
    console.warn("[order-tracking] job_stops:", stopsRes.error.message);
  }

  let driverPublic: {
    full_name: string;
    phone: string;
    vehicle_plate: string | null;
    languages_spoken: string | null;
    personal_photo_url: string | null;
    star_rating: number | null;
  } | null = null;
  if (driverAppId && driverRes.data && !driverRes.error) {
    const d = driverRes.data;
    driverPublic = {
      full_name: d.full_name ?? "",
      phone: d.phone ?? "",
      vehicle_plate: d.vehicle_plate ?? null,
      languages_spoken: d.languages_spoken ?? null,
      personal_photo_url: d.personal_photo_url ?? null,
      star_rating: d.star_rating ?? null,
    };
  }

  const [pickupG, deliveryG] = await Promise.all([
    geocodeAddressForMap(job.pickup_address),
    geocodeAddressForMap(job.delivery_address),
  ]);

  let routeGeometry: GeoJSON.LineString | null = null;
  if (pickupG && deliveryG) {
    routeGeometry = await fetchOsrmLine(pickupG, deliveryG);
    if (!routeGeometry) {
      routeGeometry = {
        type: "LineString",
        coordinates: [
          [pickupG.lon, pickupG.lat],
          [deliveryG.lon, deliveryG.lat],
        ],
      };
    }
  }

  const route_plan =
    pickupG && deliveryG
      ? {
          pickup_lat: pickupG.lat,
          pickup_lng: pickupG.lon,
          delivery_lat: deliveryG.lat,
          delivery_lng: deliveryG.lon,
          line: routeGeometry,
        }
      : null;

  const {
    confirmation_token: _ignored,
    assigned_driver_application_id: _aid,
    ...safeJob
  } = job as Record<string, unknown>;

  return NextResponse.json({
    job: safeJob,
    driver: driverPublic,
    route_plan: route_plan,
    trail: trailRes.error ? [] : trailRes.data ?? [],
    stops: stopsRes.error ? [] : stopsRes.data ?? [],
    delivered: Boolean(job.pod_completed_at),
  });
}
