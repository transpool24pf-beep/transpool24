/** One-tap navigation in Google Maps (works from WhatsApp / mobile browsers). */

export function mapsNavigateToDestination(address: string): string {
  const q = address.trim();
  if (!q) return "https://www.google.com/maps";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=driving`;
}

export function mapsRoutePickupToDelivery(pickup: string, delivery: string): string {
  const o = pickup.trim();
  const d = delivery.trim();
  if (!o || !d) return mapsNavigateToDestination(d || o);
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}&travelmode=driving`;
}
