/** Public order number shown to customers (same as admin «بيانات الطلب»). */

export function displayOrderRef(job: {
  order_number?: number | string | null;
  id?: string | null;
}): string {
  const n = job.order_number;
  if (typeof n === "number" && Number.isFinite(n)) return String(n);
  if (typeof n === "string" && /^\d+$/.test(n.trim())) return n.trim();
  return "";
}
