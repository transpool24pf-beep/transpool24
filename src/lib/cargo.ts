export type CargoType = "euro_pallet" | "pallets_boxes" | "parcels";
export type CargoSize = "XS" | "M" | "L";

/** B2B cargo categories only (booking + invoices + emails). */
export type CargoCategoryId =
  | "gold_precision_sensitive"
  | "vehicle_parts_urgent"
  | "wholesale_dry_food"
  | "printing_packaging"
  | "general_other";

export const CARGO_CATEGORIES: {
  id: CargoCategoryId;
  labelKey: string;
  suggestedSize: CargoSize;
  loadingMinutes: number;
  unloadingMinutes: number;
}[] = [
  {
    id: "gold_precision_sensitive",
    labelKey: "cargoCatGoldPrecision",
    suggestedSize: "M",
    loadingMinutes: 40,
    unloadingMinutes: 40,
  },
  {
    id: "vehicle_parts_urgent",
    labelKey: "cargoCatVehiclePartsUrgent",
    suggestedSize: "M",
    loadingMinutes: 20,
    unloadingMinutes: 20,
  },
  {
    id: "wholesale_dry_food",
    labelKey: "cargoCatWholesaleDryFood",
    suggestedSize: "L",
    loadingMinutes: 35,
    unloadingMinutes: 35,
  },
  {
    id: "printing_packaging",
    labelKey: "cargoCatPrintingPackaging",
    suggestedSize: "L",
    loadingMinutes: 30,
    unloadingMinutes: 30,
  },
  {
    id: "general_other",
    labelKey: "cargoCatGeneralOther",
    suggestedSize: "M",
    loadingMinutes: 30,
    unloadingMinutes: 30,
  },
];

/** German labels for PDF, transactional emails, admin (single source). */
export const CARGO_CATEGORY_LABEL_DE: Record<CargoCategoryId, string> = {
  gold_precision_sensitive: "Gold / Präzisionsmaschinen (sensibel)",
  vehicle_parts_urgent: "Kfz-Ersatzteile (eilig)",
  wholesale_dry_food: "Großhandel & trockene Lebensmittel",
  printing_packaging: "Druckereien & Verpackungsmaterial",
  general_other: "Allgemeine Ware / Sonstiges",
};

/** Pre-B2B category ids still stored on old jobs — show readable German label. */
export const LEGACY_CARGO_CATEGORY_LABEL_DE: Record<string, string> = {
  furniture_general: "Möbel / Allgemein (alt)",
  moving_services: "Umzugsdienstleistungen (alt)",
  cars_vehicles: "Autos und Fahrzeuge (alt)",
  motorcycles: "Motorräder (alt)",
  parcels: "Verpackte Waren / Pakete (alt)",
  piano: "Klavier (alt)",
  industrial: "Industriegüter (alt)",
  antiques: "Antiquitäten (alt)",
  vehicle_parts: "Fahrzeugteile (alt)",
  palletized: "Palettierter Gütertransport (alt)",
  office_relocation: "Büroumzug (alt)",
  miscellaneous: "Sonstiges (alt)",
};

export function isCargoCategoryId(id: unknown): id is CargoCategoryId {
  return typeof id === "string" && CARGO_CATEGORIES.some((c) => c.id === id);
}

/** Label for PDF, emails, admin — German. */
export function cargoCategoryLabelDe(id: string | null | undefined): string {
  if (id == null || id === "") return "—";
  if (isCargoCategoryId(id)) return CARGO_CATEGORY_LABEL_DE[id];
  return LEGACY_CARGO_CATEGORY_LABEL_DE[id] ?? id;
}

export function getCargoCategory(id: CargoCategoryId | string | null) {
  if (!id) return null;
  return CARGO_CATEGORIES.find((c) => c.id === id) ?? null;
}

/**
 * Load/unload minutes for pricing: fixed for all categories and weights so
 * “what you transport” and shipment weight do not change this part of the price.
 */
export function getLoadUnloadMinutes(
  _categoryId?: CargoCategoryId | string | null,
  _weightKg?: number
): { loadingMinutes: number; unloadingMinutes: number } {
  return { loadingMinutes: 30, unloadingMinutes: 30 };
}

export function volumeM3(lengthCm: number, widthCm: number, heightCm: number): number {
  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0;
  return (lengthCm * widthCm * heightCm) / 1_000_000;
}

/** Suggests XS/M/L from volume (m³) and weight (kg). */
export function suggestCargoSize(volumeM3: number, weightKg: number): CargoSize {
  if (volumeM3 <= 0 && weightKg <= 0) return "M";
  if (weightKg > 800) return "L";
  if (volumeM3 > 12) return "L";
  if (volumeM3 > 4 || weightKg > 300) return "L";
  if (volumeM3 > 1.5 || weightKg > 150) return "M";
  return "XS";
}

export function suggestVehicleLabel(size: CargoSize): string {
  switch (size) {
    case "XS":
      return "Van / Kleinwagen";
    case "M":
      return "Sprinter / Transporter";
    case "L":
      return "LKW / Großraum";
    default:
      return "—";
  }
}
