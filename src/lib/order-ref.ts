/** Public order / shipment numbers: TP-YYYY-161544 */

function yearFrom(createdAt?: string | Date | null): number {
  if (createdAt instanceof Date && !Number.isNaN(createdAt.getTime())) return createdAt.getFullYear();
  if (typeof createdAt === "string" && createdAt.trim()) {
    const d = new Date(createdAt);
    if (!Number.isNaN(d.getTime())) return d.getFullYear();
  }
  return new Date().getFullYear();
}

function serialFrom(orderNumber?: number | string | null): string {
  if (typeof orderNumber === "number" && Number.isFinite(orderNumber) && orderNumber > 0) {
    return String(Math.trunc(orderNumber));
  }
  if (typeof orderNumber === "string" && /^\d+$/.test(orderNumber.trim())) {
    return orderNumber.trim();
  }
  return "";
}

function printedAuftragFromDetails(cargoDetails?: unknown): string {
  if (!cargoDetails || typeof cargoDetails !== "object") return "";
  const raw = (cargoDetails as Record<string, unknown>).printedAuftragNumber;
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, 48);
}

export type AuftragJobRef = {
  order_number?: number | string | null;
  created_at?: string | Date | null;
  id?: string | null;
  cargo_details?: unknown;
};

/** Auftrag-Nr. printed on driver sheets and shown in admin, e.g. TP-2026-161544 */
export function formatAuftragNumber(job: AuftragJobRef): string {
  const printed = printedAuftragFromDetails(job.cargo_details);
  if (printed) return printed;
  const y = yearFrom(job.created_at);
  const serial = serialFrom(job.order_number);
  if (serial) return `TP-${y}-${serial}`;
  const fallback = (job.id ?? "").replace(/-/g, "").slice(0, 6).toUpperCase() || "000000";
  return `TP-${y}-${fallback}`;
}

/** One shipment per order — same code as Auftrag for the driver paper. */
export function formatKundennummer(job: AuftragJobRef): string {
  const printed = printedAuftragFromDetails(job.cargo_details);
  if (printed) return printed;
  return serialFrom(job.order_number) || "-";
}

/** One shipment per order — same code as Auftrag for the driver paper. */
export function formatSendungNumber(job: AuftragJobRef): string {
  return formatAuftragNumber(job);
}

/** Public order number shown to customers (same as admin «بيانات الطلب»). */
export function displayOrderRef(job: AuftragJobRef): string {
  return formatAuftragNumber(job);
}
