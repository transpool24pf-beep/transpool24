import { NextResponse } from "next/server";
import { getRouteDistanceAndDuration } from "@/lib/route-distance-server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  const res = await fetch(
    `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=de`,
    {
      headers: {
        "User-Agent": "TransPool24/1.0 (contact@transpool24.com)",
        Accept: "application/json",
      },
    }
  );
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0];
  return { lat: parseFloat(first.lat), lon: parseFloat(first.lon) };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pickup = searchParams.get("pickup");
  const delivery = searchParams.get("delivery");
  const departureTimeParam = searchParams.get("departure_time");
  if (!pickup || !delivery) {
    return NextResponse.json({ error: "Missing pickup or delivery" }, { status: 400 });
  }
  const departureTime =
    departureTimeParam && !Number.isNaN(Date.parse(departureTimeParam))
      ? new Date(departureTimeParam)
      : null;

  try {
    const [from, to] = await Promise.all([geocode(pickup), geocode(delivery)]);
    if (!from || !to) {
      return NextResponse.json({ error: "Could not geocode one or both addresses" }, { status: 400 });
    }

    const res = await fetch(
      `${OSRM_URL}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) {
      return NextResponse.json({ error: "Route not found" }, { status: 400 });
    }
    const route = data.routes[0];
    const distanceMeters = route.distance;
    let distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
    let durationMinutes: number | null = null;

    if (departureTime) {
      const routeWithDuration = await getRouteDistanceAndDuration(pickup, delivery, departureTime);
      if (routeWithDuration && routeWithDuration.distanceKm > 0) {
        distanceKm = routeWithDuration.distanceKm;
        durationMinutes = routeWithDuration.durationMinutes ?? null;
      }
    }

    return NextResponse.json({
      distanceKm,
      durationMinutes,
      from: { lat: from.lat, lon: from.lon },
      to: { lat: to.lat, lon: to.lon },
      geometry: route.geometry ?? null,
    });
  } catch (e) {
    console.error("[route-distance]", e);
    return NextResponse.json(
      { error: "Failed to calculate distance" },
      { status: 500 }
    );
  }
}
