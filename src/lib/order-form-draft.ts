import type { OrderFormData } from "@/components/OrderForm";

const STORAGE_KEY = "tp24-order-form-draft-v1";
const DRAFT_VERSION = 1 as const;

/** Geo + route line for map (JSON-serializable). */
export type StoredRouteGeo = {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  geometry: { type: "LineString"; coordinates: [number, number][] } | null;
};

export type OrderFormDraftV1 = {
  v: typeof DRAFT_VERSION;
  step: number;
  data: OrderFormData;
  pickupDateField: string;
  cargoPhotoUrls: string[];
  phoneCountryCode: string;
  distanceFromRoute: boolean;
  distanceError: string | null;
  distanceHint: string | null;
  routeDurationMinutes: number | null;
  routeGeo: StoredRouteGeo | null;
  confirmChecked: boolean;
};

/** Any customer order flow URL: /de/order, /de/order/confirm, /de/order/success, … */
export function isOrderFlowPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return /^\/[a-z]{2}\/order(\/|$)/i.test(pathname);
}

export function loadOrderFormDraft(): OrderFormDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OrderFormDraftV1>;
    if (parsed.v !== DRAFT_VERSION || typeof parsed.step !== "number" || !parsed.data || typeof parsed.data !== "object") {
      return null;
    }
    return parsed as OrderFormDraftV1;
  } catch {
    return null;
  }
}

export function saveOrderFormDraft(draft: OrderFormDraftV1): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* quota */
  }
}

export function clearOrderFormDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
