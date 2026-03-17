// Defaults (overridden by DB settings when available)
const DEFAULT_PRICE_PER_KM_CENTS: Record<string, number> = {
  XS: 80,
  M: 120,
  L: 200,
};
const DEFAULT_DRIVER_HOURLY_RATE_CENTS =
  typeof process !== "undefined" && process.env.DRIVER_HOURLY_RATE_CENTS
    ? parseInt(process.env.DRIVER_HOURLY_RATE_CENTS, 10)
    : 2500;

export type PricingOptions = {
  price_per_km_cents?: Record<string, number>;
  driver_hourly_rate_cents?: number;
};

export function calculatePriceCents(
  distanceKm: number,
  cargoSize: "XS" | "M" | "L",
  durationMinutes?: number | null,
  options?: PricingOptions | null
): number {
  const perKmMap = options?.price_per_km_cents ?? DEFAULT_PRICE_PER_KM_CENTS;
  const hourlyRate = options?.driver_hourly_rate_cents ?? DEFAULT_DRIVER_HOURLY_RATE_CENTS;
  const perKm = perKmMap[cargoSize] ?? 100;
  let total = Math.round(distanceKm * perKm);
  if (durationMinutes != null && durationMinutes > 0) {
    total += Math.round((durationMinutes / 60) * hourlyRate);
  }
  return Math.max(total, 1000); // minimum 10 EUR
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
