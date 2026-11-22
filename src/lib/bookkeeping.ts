export const BOOKKEEPING_BUCKET = "bookkeeping";

export const BOOKKEEPING_CATEGORIES = [
  "kraftstoff",
  "werkstatt",
  "maut_parken",
  "versicherung",
  "buero",
  "telekom",
  "fahrzeug",
  "sonstiges",
] as const;

export type BookkeepingCategory = (typeof BOOKKEEPING_CATEGORIES)[number];

export type BookkeepingReceipt = {
  id: string;
  original_filename: string | null;
  storage_path: string;
  mime_type: string | null;
  vendor_name: string | null;
  document_date: string | null;
  gross_cents: number | null;
  net_cents: number | null;
  vat_cents: number | null;
  vat_rate: number | null;
  currency: string;
  category: string | null;
  invoice_number: string | null;
  notes: string | null;
  ocr_status: "pending" | "done" | "failed" | "skipped";
  created_at: string;
  updated_at: string;
  file_url?: string | null;
};

export function isBookkeepingCategory(value: string): value is BookkeepingCategory {
  return (BOOKKEEPING_CATEGORIES as readonly string[]).includes(value);
}

export function eurosToCents(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100);
  }
  if (typeof value !== "string") return null;
  const t = value.trim().replace(/\s/g, "").replace("EUR", "").replace("€", "");
  if (!t) return null;
  const normalized = t.includes(",")
    ? t.replace(/\./g, "").replace(",", ".")
    : t.replace(/,/g, "");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function formatEurFromCents(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return "—";
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export function monthRangeUtc(year: number, month: number): { from: string; to: string } {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

/** Calendar date in Europe/Berlin as YYYY-MM-DD. */
export function berlinYmd(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Store a receipt on the selected month so it lands in that month's PDF. */
export function documentDateForMonth(year: number, month: number): string {
  const today = berlinYmd();
  const [ty, tm] = today.split("-").map(Number);
  if (ty === year && tm === month) return today;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}
