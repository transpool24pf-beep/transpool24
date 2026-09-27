export const DRIVER_WORK_FOCUSES = ["city_parcels", "b2b_intercity"] as const;
export type DriverWorkFocus = (typeof DRIVER_WORK_FOCUSES)[number];

export function parseDriverWorkFocus(value: unknown): DriverWorkFocus | null {
  if (value === "city_parcels" || value === "b2b_intercity") return value;
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (s === "city_parcels" || s === "b2b_intercity") return s;
  return null;
}

export function resolveDriverWorkFocus(row: {
  work_focus?: unknown;
  availability?: unknown;
  note?: unknown;
} | null | undefined): DriverWorkFocus | null {
  if (!row) return null;
  return (
    parseDriverWorkFocus(row.work_focus) ||
    parseDriverWorkFocus(row.availability) ||
    parseWorkFocusFromNote(row.note)
  );
}

function parseWorkFocusFromNote(note: unknown): DriverWorkFocus | null {
  if (typeof note !== "string" || !note) return null;
  const m = note.match(/work_focus\s*=\s*(city_parcels|b2b_intercity)/i);
  return m ? parseDriverWorkFocus(m[1]) : null;
}

