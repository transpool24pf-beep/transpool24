export type CargoType = "euro_pallet" | "pallets_boxes" | "parcels";
export type CargoSize = "XS" | "M" | "L";

/** B2B cargo categories only (booking + invoices + emails). */
export type CargoCategoryId =
  | "gold_precision_sensitive"
  | "vehicle_parts_urgent"
  | "wholesale_dry_food"
  | "printing_packaging"
  | "furniture_household"
  | "light_mixed_transport"
  | "express_parcels"
  | "building_materials_equipment"
  | "industrial_pallets"
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
    id: "furniture_household",
    labelKey: "cargoCatFurnitureHousehold",
    suggestedSize: "L",
    loadingMinutes: 45,
    unloadingMinutes: 45,
  },
  {
    id: "light_mixed_transport",
    labelKey: "cargoCatLightMixed",
    suggestedSize: "M",
    loadingMinutes: 30,
    unloadingMinutes: 30,
  },
  {
    id: "express_parcels",
    labelKey: "cargoCatExpressParcels",
    suggestedSize: "XS",
    loadingMinutes: 20,
    unloadingMinutes: 20,
  },
  {
    id: "building_materials_equipment",
    labelKey: "cargoCatBuildingMaterials",
    suggestedSize: "L",
    loadingMinutes: 40,
    unloadingMinutes: 40,
  },
  {
    id: "industrial_pallets",
    labelKey: "cargoCatIndustrialPallets",
    suggestedSize: "L",
    loadingMinutes: 35,
    unloadingMinutes: 35,
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
  furniture_household: "Möbel & Haushaltsgeräte",
  light_mixed_transport: "Leicht- und Mischtransporte",
  express_parcels: "Schnellsendungen & Pakete",
  building_materials_equipment: "Baumaterial & Geräte",
  industrial_pallets: "Industriegüter & Paletten",
  general_other: "Allgemeine Ware / Sonstiges",
};

/** Pre-B2B category ids still stored on old jobs, show readable German label. */
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

/** Label for PDF, emails, admin, German. */
export function cargoCategoryLabelDe(id: string | null | undefined): string {
  if (id == null || id === "") return "-";
  if (isLoadCarrierId(id)) return LOAD_CARRIER_LABEL_DE[id];
  if (isCargoCategoryId(id)) return CARGO_CATEGORY_LABEL_DE[id];
  return LEGACY_CARGO_CATEGORY_LABEL_DE[id] ?? id;
}

/** Load-carrier types (booking form Loads row, emails/PDF use German labels). */
export type LoadCarrierId =
  | "carton"
  | "container"
  | "dusseldorf_pallet"
  | "europallet"
  | "ftl_mega"
  | "ftl_semi_trailer"
  | "glt_long"
  | "industrial_pallet"
  | "klt"
  | "lattice_box"
  | "non_palletized_custom"
  | "palletized_custom"
  | "roll_container"
  | "twinpallet";

export const LOAD_CARRIER_LABEL_DE: Record<LoadCarrierId, string> = {
  carton: "Karton",
  container: "Container",
  dusseldorf_pallet: "Düsseldorfer Palette",
  europallet: "Europalette",
  ftl_mega: "FTL (Mega)",
  ftl_semi_trailer: "FTL (Sattelauflieger)",
  glt_long: "GLT lang",
  industrial_pallet: "Industriepalette",
  klt: "KLT",
  lattice_box: "Gitterbox",
  non_palletized_custom: "nicht palettiert, Sondermaße",
  palletized_custom: "palettiert, Sondermaße",
  roll_container: "Rollcontainer",
  twinpallet: "Twinpalette",
};

export const LOAD_CARRIERS: { id: LoadCarrierId; labelKey: string }[] = (
  Object.keys(LOAD_CARRIER_LABEL_DE) as LoadCarrierId[]
).map((id) => ({
  id,
  labelKey: `loadCarrier_${id}`,
}));

export function isLoadCarrierId(id: unknown): id is LoadCarrierId {
  return typeof id === "string" && id in LOAD_CARRIER_LABEL_DE;
}

export type CargoLoadLine = {
  quantity: number;
  loadCarrier: LoadCarrierId | "";
  content: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  kgPerUnit: number;
  stackable: boolean;
  dangerousGoods: boolean;
};

export function emptyCargoLoadLine(): CargoLoadLine {
  return {
    quantity: 1,
    loadCarrier: "",
    content: "",
    lengthCm: 100,
    widthCm: 20,
    heightCm: 20,
    kgPerUnit: 0,
    stackable: true,
    dangerousGoods: false,
  };
}

function asFiniteNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeCargoLoadLine(raw: unknown): CargoLoadLine {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const carrier = typeof o.loadCarrier === "string" ? o.loadCarrier : "";
  return {
    quantity: Math.max(0, Math.floor(asFiniteNumber(o.quantity))),
    loadCarrier: isLoadCarrierId(carrier) ? carrier : "",
    content: typeof o.content === "string" ? o.content.trim() : "",
    lengthCm: Math.max(0, asFiniteNumber(o.lengthCm)),
    widthCm: Math.max(0, asFiniteNumber(o.widthCm)),
    heightCm: Math.max(0, asFiniteNumber(o.heightCm)),
    kgPerUnit: Math.max(0, asFiniteNumber(o.kgPerUnit)),
    stackable: o.stackable !== false,
    dangerousGoods: o.dangerousGoods === true,
  };
}

export function isCargoLoadLineComplete(line: CargoLoadLine): boolean {
  return (
    line.quantity >= 1 &&
    isLoadCarrierId(line.loadCarrier) &&
    line.lengthCm > 0 &&
    line.widthCm > 0 &&
    line.heightCm > 0 &&
    line.kgPerUnit > 0
  );
}

export function parseCargoLoads(cd: Record<string, unknown> | null | undefined): CargoLoadLine[] {
  if (!cd || !Array.isArray(cd.loads) || cd.loads.length === 0) return [];
  return cd.loads.map(normalizeCargoLoadLine);
}

export function summarizeCargoLoads(loads: CargoLoadLine[]): {
  packageCount: number;
  weightKg: number;
  cargoCategory: LoadCarrierId | "";
  cargoLengthCm: number;
  cargoWidthCm: number;
  cargoHeightCm: number;
  stackable: boolean;
  dangerousGoods: boolean;
} {
  const complete = loads.filter(isCargoLoadLineComplete);
  const list = complete.length > 0 ? complete : loads;
  const packageCount = list.reduce((s, l) => s + Math.max(0, l.quantity), 0);
  const weightKg = list.reduce((s, l) => s + Math.max(0, l.quantity) * Math.max(0, l.kgPerUnit), 0);
  const first = list[0];
  return {
    packageCount,
    weightKg: Math.round(weightKg * 100) / 100,
    cargoCategory: first && isLoadCarrierId(first.loadCarrier) ? first.loadCarrier : "",
    cargoLengthCm: first?.lengthCm ?? 0,
    cargoWidthCm: first?.widthCm ?? 0,
    cargoHeightCm: first?.heightCm ?? 0,
    stackable: list.every((l) => l.stackable),
    dangerousGoods: list.some((l) => l.dangerousGoods),
  };
}

export function cargoLoadLinePlainDe(line: CargoLoadLine, index?: number, total?: number): string {
  const prefix = total != null && total > 1 && index != null ? `Ladung ${index + 1}: ` : "";
  const carrier = isLoadCarrierId(line.loadCarrier)
    ? LOAD_CARRIER_LABEL_DE[line.loadCarrier]
    : cargoCategoryLabelDe(line.loadCarrier || null);
  const content = line.content ? ` | Inhalt: ${line.content}` : "";
  const dims =
    line.lengthCm > 0 || line.widthCm > 0 || line.heightCm > 0
      ? ` | Maße: ${line.lengthCm} × ${line.widthCm} × ${line.heightCm} cm`
      : "";
  return `${prefix}${line.quantity}× ${carrier}${content}${dims} | ${line.kgPerUnit} kg/Einheit | Stapelbar: ${line.stackable ? "Ja" : "Nein"} | Gefahrgut: ${line.dangerousGoods ? "Ja" : "Nein"}`;
}

export function formatCargoLoadsPlainDe(cd: Record<string, unknown> | null | undefined): string {
  const loads = parseCargoLoads(cd).filter((l) => l.quantity >= 1);
  if (loads.length === 0) return "";
  return loads.map((l, i) => cargoLoadLinePlainDe(l, i, loads.length)).join("\n");
}

export function getCargoCategory(id: CargoCategoryId | string | null) {
  if (!id) return null;
  return CARGO_CATEGORIES.find((c) => c.id === id) ?? null;
}

/** Fixed loading + unloading block billed on every order (one-way km is billed separately). */
export const LOAD_UNLOAD_TOTAL_MINUTES = 90;

/**
 * Load/unload minutes for pricing: always 90 minutes total, independent of
 * cargo category and weight.
 */
export function getLoadUnloadMinutes(
  _categoryId?: CargoCategoryId | string | null,
  _weightKg?: number
): { loadingMinutes: number; unloadingMinutes: number } {
  const half = Math.round(LOAD_UNLOAD_TOTAL_MINUTES / 2);
  return { loadingMinutes: half, unloadingMinutes: LOAD_UNLOAD_TOTAL_MINUTES - half };
}

export function loadUnloadTotalMinutes(): number {
  const { loadingMinutes, unloadingMinutes } = getLoadUnloadMinutes();
  return loadingMinutes + unloadingMinutes;
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
      return "-";
  }
}
