export const DRIVER_WORK_FOCUSES = ["city_parcels", "b2b_intercity"] as const;
export type DriverWorkFocus = (typeof DRIVER_WORK_FOCUSES)[number];

export function parseDriverWorkFocus(value: unknown): DriverWorkFocus | null {
  if (value === "city_parcels" || value === "b2b_intercity") return value;
  return null;
}
