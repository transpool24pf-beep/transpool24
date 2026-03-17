export type CargoType = "euro_pallet" | "pallets_boxes" | "parcels";
export type CargoSize = "XS" | "M" | "L";

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
