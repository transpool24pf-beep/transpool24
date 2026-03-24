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
  /** Helfer: Stundensatz in Cent (z. B. 1630 = 16,30 €/h), wird × Fahrer-Gesamtstunden berechnet */
  assistant_fee_cents?: number;
  /** Cents per full 10 kg block; default 50 (= 0,50 €). */
  weight_surcharge_cents_per_10kg?: number;
  /** Flat cents added once per order by cargo category id. */
  cargo_category_adjustment_cents?: Record<string, number>;
};

export type ServiceType = "driver_only" | "driver_car" | "driver_car_assistant";

const DEFAULT_DRIVER_ONLY_HOURLY_CENTS = 4500; // 45 EUR/h
const DEFAULT_ASSISTANT_HOURLY_CENTS = 1630; // 16.30 EUR/h for assistant

export type PriceBreakdown = {
  distanceCents: number;
  driverTimeCents: number;
  /** Only for driver_car_assistant: assistant hourly × (total driver minutes / 60), rounded */
  assistantCents: number;
  weightSurchargeCents: number;
  /** Optional flat surcharge from “what you transport” category (cents). */
  cargoCategorySurchargeCents: number;
  totalCents: number;
  /** Minutes used for time-based charges (round-trip + load/unload) */
  billingMinutesUsed: number;
};

/** Cents for weight: `floor(kg / 10) * centsPer10Kg` (default 50 = 0,50 € per 10 kg). */
export function weightSurchargeCentsFromKg(weightKg: number, centsPer10Kg?: number | null): number {
  const w = Math.max(0, Math.floor(Number(weightKg) || 0));
  const unit = Math.max(0, Math.round(Number(centsPer10Kg ?? 50) || 0));
  return Math.floor(w / 10) * unit;
}

function resolveBillingMinutes(
  distanceKm: number,
  durationMinutes?: number | null,
  totalDriverMinutes?: number | null
): number {
  if (totalDriverMinutes != null && Number.isFinite(totalDriverMinutes) && totalDriverMinutes > 0) {
    return totalDriverMinutes;
  }
  if (durationMinutes != null && durationMinutes > 0) {
    return durationMinutes * 2;
  }
  return (distanceKm / 50) * 60 * 2;
}

/** Assistant total for the job: hourly rate × (billing minutes / 60), rounded to cents */
export function assistantChargeCentsFromMinutes(
  totalDriverMinutes: number,
  assistantHourlyCents: number
): number {
  const m = Math.max(0, Number(totalDriverMinutes));
  if (!Number.isFinite(m) || m <= 0) return 0;
  return Math.round((m / 60) * assistantHourlyCents);
}

/**
 * Full price breakdown. Assistant (Helfer) = assistant_fee_cents per hour × total driver hours
 * (same total minutes as driver time billing: round trip + loading + unloading).
 */
export function calculatePriceBreakdown(
  distanceKm: number,
  cargoSize: "XS" | "M" | "L",
  durationMinutes?: number | null,
  options?: PricingOptions | null,
  serviceType: ServiceType = "driver_car",
  totalDriverMinutes?: number | null,
  weightSurchargeCents?: number | null,
  cargoCategorySurchargeCents?: number | null
): PriceBreakdown {
  const driverOnlyHourly = options?.driver_only_hourly_cents ?? DEFAULT_DRIVER_ONLY_HOURLY_CENTS;
  const assistantHourlyCents = options?.assistant_fee_cents ?? DEFAULT_ASSISTANT_HOURLY_CENTS;
  const rawMinutes = resolveBillingMinutes(distanceKm, durationMinutes, totalDriverMinutes);
  const timeMinutes = Math.max(0, Math.round(rawMinutes));
  const weightExtra = Math.max(0, Math.round(Number(weightSurchargeCents) || 0));
  const categoryExtra = Math.max(0, Math.round(Number(cargoCategorySurchargeCents) || 0));
  const extras = weightExtra + categoryExtra;

  if (serviceType === "driver_only") {
    const total = Math.round((timeMinutes / 60) * driverOnlyHourly);
    const totalCents = Math.max(total + extras, 1000);
    return {
      distanceCents: 0,
      driverTimeCents: total,
      assistantCents: 0,
      weightSurchargeCents: weightExtra,
      cargoCategorySurchargeCents: categoryExtra,
      totalCents,
      billingMinutesUsed: timeMinutes,
    };
  }

  const perKmMap = options?.price_per_km_cents ?? DEFAULT_PRICE_PER_KM_CENTS;
  const hourlyRate = options?.driver_hourly_rate_cents ?? DEFAULT_DRIVER_HOURLY_RATE_CENTS;
  const perKm = perKmMap[cargoSize] ?? 100;
  const distanceCents = Math.round(distanceKm * perKm);
  const driverTimeCents = Math.round((timeMinutes / 60) * hourlyRate);
  const assistantCents =
    serviceType === "driver_car_assistant"
      ? assistantChargeCentsFromMinutes(timeMinutes, assistantHourlyCents)
      : 0;
  const totalCents = Math.max(distanceCents + driverTimeCents + assistantCents + extras, 1000);
  return {
    distanceCents,
    driverTimeCents,
    assistantCents,
    weightSurchargeCents: weightExtra,
    cargoCategorySurchargeCents: categoryExtra,
    totalCents,
    billingMinutesUsed: timeMinutes,
  };
}

export function calculatePriceCents(
  distanceKm: number,
  cargoSize: "XS" | "M" | "L",
  durationMinutes?: number | null,
  options?: PricingOptions | null,
  serviceType: ServiceType = "driver_car",
  totalDriverMinutes?: number | null,
  weightSurchargeCents?: number | null,
  cargoCategorySurchargeCents?: number | null
): number {
  return calculatePriceBreakdown(
    distanceKm,
    cargoSize,
    durationMinutes,
    options,
    serviceType,
    totalDriverMinutes,
    weightSurchargeCents,
    cargoCategorySurchargeCents
  ).totalCents;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Round minutes for display (avoids 44.6399999999 in UI) */
export function roundBillingMinutesDisplay(minutes: number): number {
  return Math.round(Math.max(0, Number(minutes)));
}

export function splitHoursMinutesParts(totalMinutes: number): { hours: number; minutes: number } {
  const m = roundBillingMinutesDisplay(totalMinutes);
  return { hours: Math.floor(m / 60), minutes: m % 60 };
}
