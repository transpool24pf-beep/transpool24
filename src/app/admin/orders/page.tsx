"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Job = {
  id: string;
  order_number: number | null;
  company_name: string;
  phone: string;
  customer_email: string | null;
  pickup_address: string;
  delivery_address: string;
  cargo_size: string;
  cargo_details: Record<string, unknown> | null;
  service_type?: string;
  distance_km: number | null;
  price_cents: number;
  driver_price_cents: number | null;
  payment_status: string;
  logistics_status: string;
  created_at: string;
  preferred_pickup_at: string | null;
  confirmation_token: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string; bg: string }> = {
  draft: { label: "مسودة / Draft", labelAr: "مسودة", color: "text-slate-700", bg: "bg-slate-400" },
  confirmed: { label: "قيد الانتظار / Confirmed", labelAr: "قيد الانتظار", color: "text-blue-700", bg: "bg-blue-500" },
  paid: { label: "مدفوع / Paid", labelAr: "مدفوع", color: "text-emerald-700", bg: "bg-emerald-500" },
  assigned: { label: "قيد التنفيذ / Assigned", labelAr: "قيد التنفيذ", color: "text-amber-700", bg: "bg-amber-500" },
  in_transit: { label: "في الطريق / In transit", labelAr: "في الطريق", color: "text-violet-700", bg: "bg-violet-500" },
  delivered: { label: "تم التسليم / Delivered", labelAr: "تم التسليم", color: "text-green-700", bg: "bg-green-500" },
  cancelled: { label: "ملغي / Cancelled", labelAr: "ملغي", color: "text-red-700", bg: "bg-red-500" },
};

/** سعر السائق: إما المحفوظ أو 18 × مسافة الذهاب والإياب (بالمليم) */
function getDriverPriceEur(o: Job): string {
  if (o.driver_price_cents != null) return (o.driver_price_cents / 100).toFixed(2);
  if (o.distance_km != null && o.distance_km > 0) return ((18 * o.distance_km * 2) / 100).toFixed(2);
  return "18.00";
}

/** نوع النقل بالعربية */
function serviceTypeLabelAr(st: string | undefined): string {
  if (st === "driver_only") return "سائق فقط";
  if (st === "driver_car_assistant") return "سائق مع سيارة ومعاون";
  return "سائق مع سيارة";
}

/** حجم البضاعة (أبعاد) من cargo_details */
function cargoVolumeStr(cd: Record<string, unknown> | null): string | null {
  if (!cd) return null;
  const l = cd.cargoLengthCm ?? cd.lengthCm;
  const w = cd.cargoWidthCm ?? cd.widthCm;
  const h = cd.cargoHeightCm ?? cd.heightCm;
  if (l != null && w != null && h != null) return `${l} × ${w} × ${h} cm`;
  return null;
}

const IC = {
  megaphone: "\u{1F4E2}",
  clipboard: "\u{1F4CB}",
  phone: "\u{1F4DE}",
  clock: "\u{1F556}",
  calendar: "\u{1F4C5}",
  ruler: "\u{1F4CF}",
  truck: "\u{1F69A}",
  package: "\u{1F4E6}",
  scale: "\u2696\uFE0F",
  lorry: "\u{1F69B}",
  building: "\u{1F3E2}",
  pin: "\u{1F4CD}",
  money: "\u{1F4B0}",
  worker: "\u{1F477}",
};

/** رسالة واتساب للمجموعة: كل المعلومات مع سعر السائق وسعر المعاون إن وجد، بأيقونات وسطر فارغ */
function buildWhatsAppMessage(o: Job): string {
  const orderRef = o.order_number != null ? String(o.order_number) : o.id;
  const driverEur = getDriverPriceEur(o);
  const assistantEur = "16.30";
  const hasAssistant = o.service_type === "driver_car_assistant";
  const timeStr = o.preferred_pickup_at
    ? new Date(o.preferred_pickup_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : null;
  const dateStr = o.preferred_pickup_at
    ? new Date(o.preferred_pickup_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : null;
  const weightKg = o.cargo_details && typeof o.cargo_details.weightKg === "number"
    ? o.cargo_details.weightKg
    : o.cargo_details && typeof (o.cargo_details as { cargoWeightKg?: number }).cargoWeightKg === "number"
      ? (o.cargo_details as { cargoWeightKg: number }).cargoWeightKg
      : null;
  const distanceStr = o.distance_km != null ? `${o.distance_km} km` : "—";
  const volumeStr = cargoVolumeStr(o.cargo_details);
  const serviceLabel = serviceTypeLabelAr(o.service_type);
  const blocks: string[] = [
    `${IC.megaphone} TransPool24 – طلب للنقل`,
    "",
    `${IC.clipboard} رقم الطلب: ${orderRef}`,
    "",
    `${IC.phone} الهاتف: ${o.phone}`,
    "",
    ...(timeStr ? [`${IC.clock} وقت (للحضور): ${timeStr}`] : []),
    ...(dateStr ? [`${IC.calendar} التاريخ: ${dateStr}`] : []),
    ...(timeStr || dateStr ? [""] : []),
    `${IC.ruler} المسافة: ${distanceStr}`,
    "",
    `${IC.truck} الحمولة: ${o.cargo_size}`,
    ...(volumeStr ? [`${IC.package} حجم البضاعة: ${volumeStr}`] : []),
    ...(weightKg != null ? [`${IC.scale} الوزن: ${weightKg} kg`] : []),
    `${IC.lorry} نوع النقل: ${serviceLabel}`,
    `${IC.building} الشركة: ${o.company_name}`,
    "",
    `${IC.pin} الاستلام:`,
    o.pickup_address,
    "",
    `${IC.pin} التسليم:`,
    o.delivery_address,
    "",
    `${IC.money} سعر السائق: ${driverEur} EUR`,
    ...(hasAssistant ? [`${IC.worker} سعر المعاون: ${assistantEur} EUR`] : []),
  ];
  return blocks.join("\n");
}

function matchSearch(o: Job, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const str = (v: unknown) => (v == null ? "" : String(v)).toLowerCase();
  const statusLabel = STATUS_CONFIG[o.logistics_status]?.label ?? "";
  const statusLabelAr = STATUS_CONFIG[o.logistics_status]?.labelAr ?? "";
  return (
    str(o.id).includes(s) ||
    (o.order_number != null && str(o.order_number).includes(s)) ||
    str(o.company_name).includes(s) ||
    str(o.phone).includes(s) ||
    str(o.customer_email).includes(s) ||
    str(o.pickup_address).includes(s) ||
    str(o.delivery_address).includes(s) ||
    str(o.cargo_size).includes(s) ||
    str(o.logistics_status).includes(s) ||
    str(statusLabel).includes(s) ||
    str(statusLabelAr).includes(s) ||
    str((o.price_cents / 100).toFixed(2)).includes(s) ||
    (o.driver_price_cents != null && str((o.driver_price_cents / 100).toFixed(2)).includes(s))
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sending, setSending] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = (id: string, logistics_status: string) => {
    setUpdating(id);
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, logistics_status }),
    })
      .then((r) => {
        if (r.ok) {
          setOrders((prev) =>
            prev.map((o) => (o.id === id ? { ...o, logistics_status } : o))
          );
        }
      })
      .finally(() => setUpdating(null));
  };

  const updateDriverPrice = (id: string, eurValue: string) => {
    const trimmed = eurValue.trim();
    const cents = trimmed === "" ? null : Math.round(parseFloat(trimmed.replace(",", ".")) * 100);
    if (cents !== null && (Number.isNaN(cents) || cents < 0)) return;
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, driver_price_cents: cents }),
    })
      .then((r) => {
        if (r.ok) {
          setOrders((prev) =>
            prev.map((o) => (o.id === id ? { ...o, driver_price_cents: cents } : o))
          );
        }
      });
  };

  const sendEmail = (id: string) => {
    setSending(id);
    fetch("/api/admin/send-order-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: id }),
    })
      .then((r) => {
        if (r.ok) alert("تم إرسال البريد.");
        else
          r.json().then((d) => {
            const errMsg =
              typeof d?.error === "string"
                ? d.error
                : (d?.error && typeof d.error === "object" && "message" in d.error)
                  ? String((d.error as { message: unknown }).message)
                  : "فشل الإرسال.";
            alert(errMsg);
          });
      })
      .catch(() => alert("فشل الطلب"))
      .finally(() => setSending(null));
  };

  const openWhatsApp = (o: Job) => {
    const text = buildWhatsAppMessage(o);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const openWhatsAppCustomer = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return;
    window.open(`https://wa.me/${digits}`, "_blank", "noopener");
  };

  const downloadInvoice = (jobId: string, type: "customer" | "driver") => {
    window.open(`/api/admin/invoice?job_id=${encodeURIComponent(jobId)}&type=${type}`, "_blank");
  };

  const filtered = orders
    .filter((o) => (filter ? o.logistics_status === filter : true))
    .filter((o) => matchSearch(o, searchQuery));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0d2137]">الطلبات / Orders</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث: رقم طلب، اسم، بريد، عنوان، سائق، أي نص..."
          className="min-w-[220px] flex-1 rounded-xl border-2 border-[#0d2137]/15 bg-white px-4 py-2.5 text-sm text-[#0d2137] placeholder:text-[#0d2137]/50 shadow-sm transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border-2 border-[#0d2137]/15 bg-white px-4 py-2.5 text-sm font-medium text-[#0d2137] shadow-sm transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        >
          <option value="">كل الحالات / All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([value, { labelAr }]) => (
            <option key={value} value={value}>
              {labelAr}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 shadow-lg">
          <p className="text-[#0d2137]/70">جاري التحميل…</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border-2 border-[#0d2137]/10 bg-white shadow-lg">
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed text-left text-sm">
              <thead>
                <tr className="border-b-2 border-[#0d2137]/10 bg-gradient-to-r from-[#0d2137]/10 to-[#0d2137]/5">
                  <th className="w-[8%] px-2 py-3 font-semibold text-[#0d2137]">رقم الطلب</th>
                  <th className="w-[10%] px-2 py-3 font-semibold text-[#0d2137]">الحالة</th>
                  <th className="w-[7%] px-2 py-3 font-semibold text-[#0d2137]">التاريخ</th>
                  <th className="w-[9%] px-2 py-3 font-semibold text-[#0d2137]">الشركة</th>
                  <th className="w-[14%] px-2 py-3 font-semibold text-[#0d2137]">البريد</th>
                  <th className="w-[8%] px-2 py-3 font-semibold text-[#0d2137]">سعر العميل</th>
                  <th className="w-[8%] px-2 py-3 font-semibold text-[#0d2137]">سعر السائق</th>
                  <th className="w-[7%] px-2 py-3 font-semibold text-[#0d2137]">الدفع</th>
                  <th className="w-[29%] px-2 py-3 font-semibold text-[#0d2137]">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, idx) => {
                  const statusConf = STATUS_CONFIG[o.logistics_status] ?? STATUS_CONFIG.draft;
                  return (
                    <tr
                      key={o.id}
                      className={`border-b border-[#0d2137]/5 transition hover:bg-[#0d2137]/[0.02] ${
                        idx % 2 === 1 ? "bg-[#0d2137]/[0.02]" : ""
                      }`}
                    >
                      <td className="min-w-0 px-2 py-2 font-mono text-xs font-semibold text-[#0d2137]">
                        {o.order_number ?? o.id.slice(0, 8)}
                      </td>
                      <td className="min-w-0 px-2 py-2">
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-block h-3 w-3 shrink-0 rounded-full ${statusConf.bg}`}
                            title={statusConf.labelAr}
                          />
                          <select
                            value={o.logistics_status}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            disabled={updating === o.id}
                            className={`rounded-lg border-2 bg-white px-2 py-1.5 text-xs font-medium ${statusConf.color} focus:border-[var(--accent)] focus:outline-none`}
                          >
                            {Object.entries(STATUS_CONFIG).map(([value, { labelAr }]) => (
                              <option key={value} value={value}>
                                {labelAr}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="min-w-0 px-2 py-2 text-[#0d2137]/80 text-xs">
                        {new Date(o.created_at).toLocaleDateString("de-DE")}
                      </td>
                      <td className="min-w-0 truncate px-2 py-2 font-medium text-[#0d2137] text-xs" title={o.company_name}>
                        {o.company_name}
                      </td>
                      <td className="min-w-0 px-2 py-2 text-[#0d2137]/80 text-xs break-words" title={o.customer_email ?? ""}>
                        {o.customer_email ?? "—"}
                      </td>
                      <td className="min-w-0 px-2 py-2 font-semibold text-[#0d2137] text-xs whitespace-nowrap">
                        € {(o.price_cents / 100).toFixed(2)}
                      </td>
                      <td className="min-w-0 px-2 py-2">
                        <input
                          type="text"
                          defaultValue={o.driver_price_cents != null ? (o.driver_price_cents / 100).toFixed(2).replace(".", ",") : ""}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v) updateDriverPrice(o.id, v);
                          }}
                          placeholder="—"
                          className="w-16 max-w-full rounded border border-[#0d2137]/20 px-1.5 py-1 text-xs"
                        />
                      </td>
                      <td className="min-w-0 px-2 py-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            o.payment_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {o.payment_status === "paid" ? "مدفوع" : "قيد الانتظار"}
                        </span>
                      </td>
                      <td className="min-w-0 px-2 py-2">
                        <div className="flex flex-row flex-wrap items-center gap-1.5">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="inline-flex items-center justify-center rounded-lg bg-[#0d2137] px-2 py-1.5 text-[10px] font-medium text-white hover:bg-[#0d2137]/90"
                          >
                            فتح
                          </Link>
                          <button
                            type="button"
                            onClick={() => openWhatsApp(o)}
                            className="inline-flex items-center justify-center rounded-lg bg-[#25D366] px-2 py-1.5 text-[10px] font-medium text-white hover:bg-[#20bd5a]"
                          >
                            واتساب مجموعة
                          </button>
                          <button
                            type="button"
                            onClick={() => openWhatsAppCustomer(o.phone)}
                            className="inline-flex items-center justify-center rounded-lg border border-[#25D366] bg-[#25D366]/10 px-2 py-1.5 text-[10px] font-medium text-[#25D366] hover:bg-[#25D366]/20"
                          >
                            واتساب عميل
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadInvoice(o.id, "driver")}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800 hover:bg-amber-100"
                          >
                            فاتورة مجموعة
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadInvoice(o.id, "customer")}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-800 hover:bg-blue-100"
                          >
                            فاتورة عميل
                          </button>
                          {o.customer_email && (
                            <button
                              type="button"
                              onClick={() => sendEmail(o.id)}
                              disabled={sending === o.id}
                              className="rounded-lg bg-[var(--accent)] px-2 py-1 text-[10px] font-medium text-white hover:opacity-90 disabled:opacity-60"
                            >
                              {sending === o.id ? "…" : "بريد"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-[#0d2137]/70 shadow-lg">
          لا توجد طلبات.
        </p>
      )}
    </div>
  );
}
