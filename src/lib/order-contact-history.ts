/**
 * Browser-local contact triples saved when the customer completes step 1 (Next).
 * Separate from session draft; not cleared when leaving the order flow.
 */
const STORAGE_KEY = "tp24-order-contact-history-v1";
const MAX_ITEMS = 20;

export type OrderContactEntry = {
  companyName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
};

function dedupeKey(e: OrderContactEntry): string {
  const em = e.email.trim().toLowerCase();
  const digits = `${e.phoneCountryCode}${e.phone}`.replace(/\D/g, "");
  return `${em}|${digits}`;
}

export function isStorableContactEntry(c: OrderContactEntry): boolean {
  if (!c.companyName.trim()) return false;
  const em = c.email.trim();
  if (!em || !em.includes("@") || em.length < 5) return false;
  if (!c.phone.trim()) return false;
  const digits = `${c.phoneCountryCode}${c.phone}`.replace(/\D/g, "");
  return digits.length >= 8;
}

export function loadOrderContactHistory(): OrderContactEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is OrderContactEntry =>
        x != null &&
        typeof x === "object" &&
        typeof (x as OrderContactEntry).companyName === "string" &&
        typeof (x as OrderContactEntry).email === "string" &&
        typeof (x as OrderContactEntry).phoneCountryCode === "string" &&
        typeof (x as OrderContactEntry).phone === "string"
    );
  } catch {
    return [];
  }
}

export function saveOrderContactHistory(items: OrderContactEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* quota */
  }
}

export function mergePersistedContact(prev: OrderContactEntry[], entry: OrderContactEntry): OrderContactEntry[] {
  if (!isStorableContactEntry(entry)) return prev;
  const key = dedupeKey(entry);
  const filtered = prev.filter((x) => dedupeKey(x) !== key);
  const next = [
    {
      companyName: entry.companyName.trim(),
      email: entry.email.trim(),
      phoneCountryCode: entry.phoneCountryCode.trim() || "+49",
      phone: entry.phone.trim(),
    },
    ...filtered,
  ].slice(0, MAX_ITEMS);
  saveOrderContactHistory(next);
  return next;
}

export function filterContactHistoryForQuery(
  history: OrderContactEntry[],
  companyName: string,
  email: string,
  phone: string,
  limit = 8
): OrderContactEntry[] {
  const q = `${companyName} ${email} ${phone}`.trim().toLowerCase();
  if (!q) return history.slice(0, limit);
  return history
    .filter((e) => {
      const blob = `${e.companyName} ${e.email} ${e.phoneCountryCode} ${e.phone}`.toLowerCase();
      return blob.includes(q);
    })
    .slice(0, limit);
}
