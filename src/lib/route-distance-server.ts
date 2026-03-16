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

/**
 * Returns route distance in km (driving) or null if calculation fails.
 * Used server-side only for locking price.
 */
export async function getRouteDistanceKm(
  pickupAddress: string,
  deliveryAddress: string
): Promise<number | null> {
  const [from, to] = await Promise.all([
    geocode(pickupAddress.trim()),
    geocode(deliveryAddress.trim()),
  ]);
  if (!from || !to) return null;
  try {
    const res = await fetch(
      `${OSRM_URL}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
    );
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const distanceMeters = data.routes[0].distance;
    return Math.round((distanceMeters / 1000) * 10) / 10;
  } catch {
    return null;
  }
}
