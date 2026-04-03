/** Local calendar date YYYY-MM-DD (no UTC shift for "today"). */
export function localTodayIso(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = n.getMonth() + 1;
  const d = n.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Live typing: keep digits only (max 8) and insert slashes → DD/MM/YYYY.
 * Pasting "01081992" becomes "01/08/1992".
 */
export function maskPickupDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Show stored ISO as DD/MM/YYYY with slashes (matches mask while typing). */
export function formatIsoDateForOrderInput(iso: string, _locale?: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  const dd = d!.padStart(2, "0");
  const mm = m!.padStart(2, "0");
  const yyyy = y!;
  return `${dd}/${mm}/${yyyy}`;
}

export type ParsedOrderDate = { kind: "empty" } | { kind: "valid"; iso: string } | { kind: "invalid" };

/** Parse typed date; empty string → clear. */
export function parseOrderDateInputToIso(raw: string): ParsedOrderDate {
  const t = raw.trim();
  if (!t) return { kind: "empty" };

  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return { kind: "valid", iso: t };
  }

  const parts = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!parts) return { kind: "invalid" };

  const d = parseInt(parts[1], 10);
  const mo = parseInt(parts[2], 10);
  const y = parseInt(parts[3], 10);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return { kind: "invalid" };

  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return { kind: "invalid" };
  }

  return {
    kind: "valid",
    iso: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
  };
}
