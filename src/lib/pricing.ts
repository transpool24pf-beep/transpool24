// Base price per km (in cents) by cargo size – adjust as needed
const PRICE_PER_KM_CENTS: Record<string, number> = {
  XS: 80,
  M: 120,
  L: 200,
};

// Driver hourly rate (cents). Used when duration from Google Directions (traffic-aware) is available.
const DRIVER_HOURLY_RATE_CENTS =
  typeof process !== "undefined" && process.env.DRIVER_HOURLY_RATE_CENTS
    ? parseInt(process.env.DRIVER_HOURLY_RATE_CENTS, 10)
    : 2500; // 25 EUR/hour default

export function calculatePriceCents(
  distanceKm: number,
  cargoSize: "XS" | "M" | "L",
  durationMinutes?: number | null
): number {
  const perKm = PRICE_PER_KM_CENTS[cargoSize] ?? 100;
  let total = Math.round(distanceKm * perKm);
  if (durationMinutes != null && durationMinutes > 0) {
    total += Math.round((durationMinutes / 60) * DRIVER_HOURLY_RATE_CENTS);
  }
  return Math.max(total, 1000); // minimum 10 EUR
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
