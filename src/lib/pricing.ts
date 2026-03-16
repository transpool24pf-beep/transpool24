// Base price per km (in cents) by cargo size – adjust as needed
const PRICE_PER_KM_CENTS: Record<string, number> = {
  XS: 80,
  M: 120,
  L: 200,
  XL: 350,
};

export function calculatePriceCents(distanceKm: number, cargoSize: "XS" | "M" | "L" | "XL"): number {
  const perKm = PRICE_PER_KM_CENTS[cargoSize] ?? 100;
  const total = Math.round(distanceKm * perKm);
  return Math.max(total, 1000); // minimum 10 EUR
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
