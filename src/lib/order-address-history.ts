/**
 * Browser-local list of address lines the customer completed on a past step-2 "Next".
 * Not sent to the server; privacy-friendly device-only recall.
 */
const STORAGE_KEY = "tp24-order-address-history-v1";
const MAX_ITEMS = 30;

function normalizeAddressKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Same bar as OrderForm before continuing — only store reasonably complete lines */
export function isStorableOrderAddressLine(value: string): boolean {
  const t = value.trim();
  if (t.length < 10) return false;
  return /\b\d{5}\b/.test(t);
}

export function loadOrderAddressHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  } catch {
    return [];
  }
}

export function saveOrderAddressHistory(items: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* quota / private mode */
  }
}

/** Add one line to the front; dedupe by normalized key; cap length */
export function appendOrderAddressLine(prev: string[], line: string): string[] {
  const t = line.trim();
  if (!isStorableOrderAddressLine(t)) return prev;
  const key = normalizeAddressKey(t);
  const filtered = prev.filter((x) => normalizeAddressKey(x) !== key);
  return [t, ...filtered].slice(0, MAX_ITEMS);
}

export function mergePersistedAddresses(prev: string[], pickup: string, delivery: string): string[] {
  let next = appendOrderAddressLine(prev, pickup);
  next = appendOrderAddressLine(next, delivery);
  saveOrderAddressHistory(next);
  return next;
}

/** Filter saved lines by current query; empty query → most recent first (capped) */
export function filterAddressHistoryForQuery(history: string[], query: string, limit = 10): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return history.slice(0, limit);
  return history.filter((line) => line.toLowerCase().includes(q)).slice(0, limit);
}
