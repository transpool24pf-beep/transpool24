export type CargoType = "euro_pallet" | "pallets_boxes" | "parcels";
export type CargoSize = "XS" | "M" | "L";

/** AnyVan-style cargo category: id, label key, suggested size, load/unload minutes */
export type CargoCategoryId =
  | "furniture_general"
  | "moving_services"
  | "cars_vehicles"
  | "motorcycles"
  | "parcels"
  | "piano"
  | "industrial"
  | "antiques"
  | "vehicle_parts"
  | "palletized"
  | "office_relocation"
  | "miscellaneous";

export const CARGO_CATEGORIES: {
  id: CargoCategoryId;
  labelKey: string;
  suggestedSize: CargoSize;
  loadingMinutes: number;
  unloadingMinutes: number;
}[] = [
  { id: "furniture_general", labelKey: "cargoCatFurniture", suggestedSize: "M", loadingMinutes: 30, unloadingMinutes: 30 },
  { id: "moving_services", labelKey: "cargoCatMoving", suggestedSize: "L", loadingMinutes: 45, unloadingMinutes: 45 },
  { id: "cars_vehicles", labelKey: "cargoCatCars", suggestedSize: "L", loadingMinutes: 60, unloadingMinutes: 60 },
  { id: "motorcycles", labelKey: "cargoCatMotorcycles", suggestedSize: "M", loadingMinutes: 30, unloadingMinutes: 30 },
  { id: "parcels", labelKey: "cargoCatParcels", suggestedSize: "XS", loadingMinutes: 15, unloadingMinutes: 15 },
  { id: "piano", labelKey: "cargoCatPiano", suggestedSize: "L", loadingMinutes: 60, unloadingMinutes: 60 },
  { id: "industrial", labelKey: "cargoCatIndustrial", suggestedSize: "L", loadingMinutes: 45, unloadingMinutes: 45 },
  { id: "antiques", labelKey: "cargoCatAntiques", suggestedSize: "M", loadingMinutes: 45, unloadingMinutes: 45 },
  { id: "vehicle_parts", labelKey: "cargoCatVehicleParts", suggestedSize: "M", loadingMinutes: 20, unloadingMinutes: 20 },
  { id: "palletized", labelKey: "cargoCatPalletized", suggestedSize: "L", loadingMinutes: 30, unloadingMinutes: 30 },
  { id: "office_relocation", labelKey: "cargoCatOffice", suggestedSize: "L", loadingMinutes: 60, unloadingMinutes: 60 },
  { id: "miscellaneous", labelKey: "cargoCatMisc", suggestedSize: "M", loadingMinutes: 30, unloadingMinutes: 30 },
];

export function getCargoCategory(id: CargoCategoryId | string | null) {
  if (!id) return null;
  return CARGO_CATEGORIES.find((c) => c.id === id) ?? null;
}

/** Load/unload minutes for pricing. Heavy weight adds extra time. */
export function getLoadUnloadMinutes(
  categoryId: CargoCategoryId | string | null,
  weightKg: number = 0
): { loadingMinutes: number; unloadingMinutes: number } {
  const cat = getCargoCategory(categoryId);
  let loading = cat?.loadingMinutes ?? 30;
  let unloading = cat?.unloadingMinutes ?? 30;
  if (weightKg > 300) {
    loading += 15;
    unloading += 15;
  } else if (weightKg > 150) {
    loading += 5;
    unloading += 5;
  }
  return { loadingMinutes: loading, unloadingMinutes: unloading };
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
