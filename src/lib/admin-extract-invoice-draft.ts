const STORAGE_KEY = "tp24-admin-extract-invoice-draft-v1";

export type ExtractInvoiceDraft = {
  name: string;
  email: string;
  phone: string;
  street: string;
  house: string;
  plz: string;
  city: string;
  country: string;
  customerNo: string;
  net: string;
  serviceDate: string;
  pickup: string;
  delivery: string;
  paymentDays: string;
  delStreet: string;
  delHouse: string;
  delPlz: string;
  delCity: string;
  delCountry: string;
};

export const EMPTY_EXTRACT_INVOICE_DRAFT: ExtractInvoiceDraft = {
  name: "",
  email: "",
  phone: "",
  street: "",
  house: "",
  plz: "",
  city: "",
  country: "Deutschland",
  customerNo: "",
  net: "",
  serviceDate: "",
  pickup: "",
  delivery: "",
  paymentDays: "7",
  delStreet: "",
  delHouse: "",
  delPlz: "",
  delCity: "",
  delCountry: "Deutschland",
};

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function loadExtractInvoiceDraft(): ExtractInvoiceDraft {
  if (typeof window === "undefined") return { ...EMPTY_EXTRACT_INVOICE_DRAFT };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_EXTRACT_INVOICE_DRAFT };
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || typeof o !== "object") return { ...EMPTY_EXTRACT_INVOICE_DRAFT };
    return {
      name: str(o.name),
      email: str(o.email),
      phone: str(o.phone),
      street: str(o.street),
      house: str(o.house),
      plz: str(o.plz),
      city: str(o.city),
      country: str(o.country, "Deutschland") || "Deutschland",
      customerNo: str(o.customerNo),
      net: str(o.net),
      serviceDate: str(o.serviceDate),
      pickup: str(o.pickup),
      delivery: str(o.delivery),
      paymentDays: str(o.paymentDays, "7") || "7",
      delStreet: str(o.delStreet),
      delHouse: str(o.delHouse),
      delPlz: str(o.delPlz),
      delCity: str(o.delCity),
      delCountry: str(o.delCountry, "Deutschland") || "Deutschland",
    };
  } catch {
    return { ...EMPTY_EXTRACT_INVOICE_DRAFT };
  }
}

export function saveExtractInvoiceDraft(draft: ExtractInvoiceDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}
