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
  driver_only_hourly_cents?: number;
  assistant_fee_cents?: number;
};

export type ServiceType = "driver_only" | "driver_car" | "driver_car_assistant";

const DEFAULT_DRIVER_ONLY_HOURLY_CENTS = 4500; // 45 EUR/h
const DEFAULT_ASSISTANT_FEE_CENTS = 1630;     // 16.30 EUR

/**
 * Total driver minutes = round-trip travel + loading + unloading.
 * When totalDriverMinutes is set, it is used for the time-based part of the price.
 */
export function calculatePriceCents(
  distanceKm: number,
  cargoSize: "XS" | "M" | "L",
  durationMinutes?: number | null,
  options?: PricingOptions | null,
  serviceType: ServiceType = "driver_car",
  totalDriverMinutes?: number | null
): number {
  const driverOnlyHourly = options?.driver_only_hourly_cents ?? DEFAULT_DRIVER_ONLY_HOURLY_CENTS;
  const assistantFee = options?.assistant_fee_cents ?? DEFAULT_ASSISTANT_FEE_CENTS;

  if (serviceType === "driver_only") {
    const minutes = totalDriverMinutes ?? (durationMinutes != null && durationMinutes > 0 ? durationMinutes * 2 : null) ?? (distanceKm / 50) * 60 * 2;
    const total = Math.round((minutes / 60) * driverOnlyHourly);
    return Math.max(total, 1000);
  }

  const perKmMap = options?.price_per_km_cents ?? DEFAULT_PRICE_PER_KM_CENTS;
  const hourlyRate = options?.driver_hourly_rate_cents ?? DEFAULT_DRIVER_HOURLY_RATE_CENTS;
  const perKm = perKmMap[cargoSize] ?? 100;
  let total = Math.round(distanceKm * perKm);
  const timeMinutes = totalDriverMinutes ?? (durationMinutes != null && durationMinutes > 0 ? durationMinutes * 2 : null) ?? (distanceKm / 50) * 60 * 2;
  total += Math.round((timeMinutes / 60) * hourlyRate);
  if (serviceType === "driver_car_assistant") {
    total += assistantFee;
  }
  return Math.max(total, 1000);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
