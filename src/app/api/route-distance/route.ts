import { NextResponse } from "next/server";
import { fetchGoogleDrivingRoute } from "@/lib/google-maps-route";
import { geocodeAddressForMap } from "@/lib/route-distance-server";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

/** Shown when routing fails so admins can fix Google Cloud / Vercel setup */
const HINT_GOOGLE_SERVER =
  "Google Cloud: enable Directions API + Geocoding API (same project as Places). For the API key → Application restrictions: use “None” or restrict by API only — not “HTTP referrers only” (server requests from Vercel have no browser referrer).";

const HINT_NO_KEY =
  "Set GOOGLE_MAPS_API_KEY in Vercel → Environment Variables, save, then Redeploy.";

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

  const key = process.env.GOOGLE_MAPS_API_KEY;

  try {
    if (key) {
      const googleRoute = await fetchGoogleDrivingRoute(
        pickup.trim(),
        delivery.trim(),
        key,
        departureTime
      );
      if (googleRoute) {
        return NextResponse.json({
          distanceKm: googleRoute.distanceKm,
          durationMinutes: googleRoute.durationMinutes,
          from: googleRoute.from,
          to: googleRoute.to,
          geometry: googleRoute.geometry,
        });
      }
    }

    const [from, to] = await Promise.all([
      geocodeAddressForMap(pickup),
      geocodeAddressForMap(delivery),
    ]);
    if (!from || !to) {
      return NextResponse.json(
        {
          error: "Could not geocode one or both addresses",
          hint: key ? HINT_GOOGLE_SERVER : HINT_NO_KEY,
        },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${OSRM_URL}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) {
      return NextResponse.json(
        {
          error: "Route not found",
          hint: key ? HINT_GOOGLE_SERVER : "Try selecting a full address from suggestions (street + city).",
        },
        { status: 400 }
      );
    }
    const route = data.routes[0];
    const distanceMeters = route.distance;
    const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
    const durationSeconds = typeof route.duration === "number" ? route.duration : 0;
    const durationMinutes = durationSeconds > 0 ? Math.round(durationSeconds / 60) : null;

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
