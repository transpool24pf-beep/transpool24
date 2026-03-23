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
  duration_minutes?: number | null;
  price_cents: number;
  driver_price_cents: number | null;
  assistant_price_cents: number | null;
  payment_status: string;
  logistics_status: string;
  created_at: string;
  preferred_pickup_at: string | null;
  confirmation_token: string | null;
  assigned_driver_application_id?: string | null;
  estimated_arrival_at?: string | null;
  eta_minutes_remaining?: number | null;
  last_driver_location_at?: string | null;
  pod_photo_url?: string | null;
  pod_completed_at?: string | null;
};

const STATUS_CONFIG: Record<string, { labelDe: string; labelAr: string; color: string; bg: string }> = {
  draft: { labelDe: "Entwurf", labelAr: "مسودة", color: "text-slate-700", bg: "bg-slate-400" },
  confirmed: { labelDe: "Bestätigt", labelAr: "مؤكد", color: "text-blue-700", bg: "bg-blue-500" },
  paid: { labelDe: "Bezahlt", labelAr: "مدفوع", color: "text-emerald-700", bg: "bg-emerald-500" },
  assigned: { labelDe: "Zugewiesen", labelAr: "مُعيَّن", color: "text-amber-700", bg: "bg-amber-500" },
  in_transit: { labelDe: "Unterwegs", labelAr: "في الطريق", color: "text-violet-700", bg: "bg-violet-500" },
  delivered: { labelDe: "Zugestellt", labelAr: "تم التوصيل", color: "text-green-700", bg: "bg-green-500" },
  cancelled: { labelDe: "Storniert", labelAr: "ملغى", color: "text-red-700", bg: "bg-red-500" },
};

/** طلبات نشطة (ليست مسودة ولا ملغاة ولا مُسلَّمة) */
const IN_PROGRESS_STATUSES = new Set(["confirmed", "paid", "assigned", "in_transit"]);

/** عمود «طلب شركة» — يطابق نوع الخدمة المستخدم في التسعير عند الدفع */
function serviceTypeCompanyRequestLabel(st: string | undefined): string {
  if (st === "driver_only") return "شوفير من دون سيارة";
  if (st === "driver_car_assistant") return "شوفير مع سيارة ومعاون";
  return "شوفير مع سيارة";
}

function serviceTypeLabelDe(st: string | undefined): string {
  if (st === "driver_only") return "Nur Fahrer";
  if (st === "driver_car_assistant") return "Fahrer mit Fahrzeug + Helfer";
  return "Fahrer mit Fahrzeug";
}

function matchSearch(o: Job, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const str = (v: unknown) => (v == null ? "" : String(v)).toLowerCase();
  const statusLabelDe = STATUS_CONFIG[o.logistics_status]?.labelDe ?? "";
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
    str(statusLabelDe).includes(s) ||
    str(statusLabelAr).includes(s) ||
    str((o.price_cents / 100).toFixed(2)).includes(s) ||
    (o.driver_price_cents != null && str((o.driver_price_cents / 100).toFixed(2)).includes(s)) ||
    (o.assistant_price_cents != null &&
      str((o.assistant_price_cents / 100).toFixed(2)).includes(s)) ||
    str(serviceTypeCompanyRequestLabel(o.service_type)).includes(s) ||
    str(serviceTypeLabelDe(o.service_type)).includes(s) ||
    str(o.service_type ?? "").includes(s)
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
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
      .then(async (r) => {
        const data = r.ok ? ((await r.json()) as Partial<Job> & { id?: string }) : null;
        if (data?.id) {
          setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));
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
    }).then(async (r) => {
      const data = r.ok ? ((await r.json()) as Partial<Job> & { id?: string }) : null;
      if (data?.id) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));
      }
    });
  };

  const updateAssistantPrice = (id: string, eurValue: string) => {
    const trimmed = eurValue.trim();
    const cents =
      trimmed === "" ? null : Math.round(parseFloat(trimmed.replace(",", ".")) * 100);
    if (trimmed !== "" && (cents === null || Number.isNaN(cents) || cents < 0)) return;
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, assistant_price_cents: cents }),
    }).then(async (r) => {
      const data = r.ok ? ((await r.json()) as Partial<Job> & { id?: string }) : null;
      if (data?.id) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));
      }
    });
  };

  const filtered = orders
    .filter((o) => (filter ? o.logistics_status === filter : true))
    .filter((o) => matchSearch(o, searchQuery));

  const inProgressOrders = orders
    .filter((o) => IN_PROGRESS_STATUSES.has(o.logistics_status))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const deliveredOrders = orders
    .filter((o) => o.logistics_status === "delivered")
    .sort((a, b) => {
      const ta = a.pod_completed_at ? new Date(a.pod_completed_at).getTime() : 0;
      const tb = b.pod_completed_at ? new Date(b.pod_completed_at).getTime() : 0;
      if (tb !== ta) return tb - ta;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold text-[#0d2137]">Aufträge / طلبات</h1>
        {!loading && (
          <a
            href="#admin-order-ops"
            className="inline-flex w-fit items-center gap-2 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-semibold text-[#0d2137] hover:bg-[var(--accent)]/20"
            dir="rtl"
          >
            <span aria-hidden>↓</span>
            قيد التنفيذ وتم التوصيل (صور) — انتقل للأسفل
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Suche: Auftragsnr., Firma, E-Mail, Adresse, Status …"
          className="min-w-[220px] flex-1 rounded-xl border-2 border-[#0d2137]/15 bg-white px-4 py-2.5 text-sm text-[#0d2137] placeholder:text-[#0d2137]/50 shadow-sm transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border-2 border-[#0d2137]/15 bg-white px-4 py-2.5 text-sm font-medium text-[#0d2137] shadow-sm transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        >
          <option value="">Alle Status</option>
          {Object.entries(STATUS_CONFIG).map(([value, { labelDe, labelAr }]) => (
            <option key={value} value={value}>
              {labelAr} · {labelDe}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 shadow-lg">
          <p className="text-[#0d2137]/70">Laden…</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border-2 border-[#0d2137]/10 bg-white shadow-lg">
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed text-left text-sm">
              <thead>
                <tr className="border-b-2 border-[#0d2137]/10 bg-gradient-to-r from-[#0d2137]/10 to-[#0d2137]/5">
                  <th className="w-[8%] px-2 py-3 font-semibold text-[#0d2137]">Nr.</th>
                  <th className="w-[10%] px-2 py-3 font-semibold text-[#0d2137]">Status</th>
                  <th className="w-[7%] px-2 py-3 font-semibold text-[#0d2137]">Datum</th>
                  <th className="w-[9%] px-2 py-3 font-semibold text-[#0d2137]">Firma</th>
                  <th className="w-[12%] px-2 py-3 font-semibold text-[#0d2137]" dir="rtl">
                    طلب شركة
                  </th>
                  <th className="w-[7%] px-2 py-3 font-semibold text-[#0d2137]">Kunde €</th>
                  <th className="w-[7%] px-2 py-3 font-semibold text-[#0d2137]">Fahrer €</th>
                  <th className="w-[8%] px-2 py-3 font-semibold text-[#0d2137]" dir="rtl">
                    معاون €
                  </th>
                  <th className="w-[7%] px-2 py-3 font-semibold text-[#0d2137]">Zahlung</th>
                  <th className="w-[10%] px-2 py-3 font-semibold text-[#0d2137]" dir="rtl">
                    إجراءات
                  </th>
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
                            title={`${statusConf.labelAr} / ${statusConf.labelDe}`}
                          />
                          <select
                            value={o.logistics_status}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            disabled={updating === o.id}
                            className={`rounded-lg border-2 bg-white px-2 py-1.5 text-xs font-medium ${statusConf.color} focus:border-[var(--accent)] focus:outline-none`}
                          >
                            {Object.entries(STATUS_CONFIG).map(([value, { labelDe, labelAr }]) => (
                              <option key={value} value={value}>
                                {labelAr} · {labelDe}
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
                      <td
                        className="min-w-0 px-2 py-2 text-xs font-medium text-[#0d2137] leading-snug"
                        dir="rtl"
                        title={serviceTypeLabelDe(o.service_type)}
                      >
                        {serviceTypeCompanyRequestLabel(o.service_type)}
                      </td>
                      <td
                        className="min-w-0 px-2 py-2 font-semibold text-[#0d2137] text-xs whitespace-nowrap"
                        title="Kundenpreis (bei Zahlung nach Service-Typ berechnet)"
                      >
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
                        {o.service_type === "driver_car_assistant" ? (
                          <input
                            type="text"
                            key={`${o.id}-asst-${o.assistant_price_cents ?? "x"}`}
                            defaultValue={
                              o.assistant_price_cents != null
                                ? (o.assistant_price_cents / 100).toFixed(2).replace(".", ",")
                                : ""
                            }
                            onBlur={(e) => updateAssistantPrice(o.id, e.target.value)}
                            placeholder="—"
                            title="تسعير المعاون (لطلبات شوفير + معاون)"
                            className="w-16 max-w-full rounded border border-violet-200 bg-violet-50/40 px-1.5 py-1 text-xs"
                          />
                        ) : (
                          <span className="text-xs text-[#0d2137]/40">—</span>
                        )}
                      </td>
                      <td className="min-w-0 px-2 py-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            o.payment_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {o.payment_status === "paid" ? "Bezahlt" : "Ausstehend"}
                        </span>
                      </td>
                      <td className="min-w-0 px-2 py-2" dir="rtl">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-[#0d2137] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0d2137]/90"
                        >
                          فتح ملف
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && (
        <div
          id="admin-order-ops"
          className="scroll-mt-24 space-y-8 rounded-2xl border-2 border-[#0d2137]/10 bg-gradient-to-b from-white to-[#0d2137]/[0.02] p-6 shadow-lg ring-2 ring-[var(--accent)]/20"
          dir="rtl"
        >
          <p className="border-b border-[#0d2137]/10 pb-3 text-sm font-medium text-[#0d2137]/80">
            لوحة التشغيل — تظهر دائماً تحت الجدول: الطلبات النشطة ثم المُسلَّمة مع صور الإثبات.
          </p>
          {orders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#0d2137]/25 bg-white p-8 text-center text-sm text-[#0d2137]/65">
              لا توجد طلبات في النظام (تحقق من الاتصال أو صلاحيات API).
            </p>
          ) : (
            <>
            <h2 className="text-xl font-bold text-[#0d2137]">تنفيذ الطلبات — قيد التنفيذ</h2>
            <p className="mt-1 text-sm text-[#0d2137]/65">
              طلبات مؤكدة أو مسار التوصيل (مؤكد، مدفوع، مُعيَّن، في الطريق). تفاصيل التتبع ووقت الوصول المتوقع هنا فقط.
            </p>
            {inProgressOrders.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-[#0d2137]/20 bg-white/80 p-6 text-center text-sm text-[#0d2137]/60">
                لا توجد طلبات قيد التنفيذ حالياً.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {inProgressOrders.map((o) => {
                  const st = STATUS_CONFIG[o.logistics_status] ?? STATUS_CONFIG.draft;
                  const etaStr =
                    o.estimated_arrival_at != null
                      ? new Date(o.estimated_arrival_at).toLocaleString("ar-SA", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : null;
                  const lastGpsStr =
                    o.last_driver_location_at != null
                      ? new Date(o.last_driver_location_at).toLocaleString("ar-SA", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : null;
                  return (
                    <div
                      key={o.id}
                      className="flex flex-col rounded-xl border-2 border-violet-200/80 bg-white p-4 shadow-sm transition hover:border-violet-300"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-[#0d2137]/10 pb-2">
                        <div>
                          <p className="font-mono text-sm font-bold text-[#0d2137]">
                            #{o.order_number ?? o.id.slice(0, 8)}
                          </p>
                          <span
                            className={`mt-1 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium ${st.color}`}
                          >
                            <span className={`h-2 w-2 rounded-full ${st.bg}`} />
                            {st.labelAr}
                          </span>
                        </div>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="shrink-0 rounded-lg bg-[#0d2137] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#0d2137]/90"
                        >
                          فتح الملف
                        </Link>
                      </div>
                      <dl className="mt-3 space-y-1.5 text-xs text-[#0d2137]/85">
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#0d2137]/55">الشركة</dt>
                          <dd className="max-w-[65%] text-left font-medium">{o.company_name}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#0d2137]/55">نوع الخدمة</dt>
                          <dd className="max-w-[65%] text-left">{serviceTypeCompanyRequestLabel(o.service_type)}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#0d2137]/55">العميل €</dt>
                          <dd className="font-semibold">{(o.price_cents / 100).toFixed(2)} €</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#0d2137]/55">السائق €</dt>
                          <dd>
                            {o.driver_price_cents != null ? (o.driver_price_cents / 100).toFixed(2) : "—"} €
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#0d2137]/55">الدفع</dt>
                          <dd>
                            {o.payment_status === "paid" ? (
                              <span className="text-emerald-700">مدفوع</span>
                            ) : (
                              <span className="text-amber-700">قيد الانتظار</span>
                            )}
                          </dd>
                        </div>
                        {o.distance_km != null && (
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#0d2137]/55">المسافة</dt>
                            <dd>{o.distance_km} km</dd>
                          </div>
                        )}
                        {o.duration_minutes != null && o.duration_minutes > 0 && (
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#0d2137]/55">مدة التوجيه (دقيقة)</dt>
                            <dd>{o.duration_minutes}</dd>
                          </div>
                        )}
                        {o.eta_minutes_remaining != null && (
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#0d2137]/55">دقائق متبقية (ETA)</dt>
                            <dd>{o.eta_minutes_remaining}</dd>
                          </div>
                        )}
                        {etaStr && (
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#0d2137]/55">وصول متوقع</dt>
                            <dd className="text-left text-[11px] leading-tight">{etaStr}</dd>
                          </div>
                        )}
                        {lastGpsStr && (
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#0d2137]/55">آخر موقع GPS</dt>
                            <dd className="text-left text-[11px] leading-tight">{lastGpsStr}</dd>
                          </div>
                        )}
                        <div className="border-t border-[#0d2137]/10 pt-2">
                          <dt className="text-[#0d2137]/55">الاستلام</dt>
                          <dd className="mt-0.5 text-left text-[11px] leading-snug">{o.pickup_address}</dd>
                        </div>
                        <div>
                          <dt className="text-[#0d2137]/55">التسليم</dt>
                          <dd className="mt-0.5 text-left text-[11px] leading-snug">{o.delivery_address}</dd>
                        </div>
                      </dl>
                    </div>
                  );
                })}
              </div>
            )}

          <div className="pt-2">
            <h2 className="text-xl font-bold text-[#0d2137]">تم التوصيل — إثبات التسليم (صورة)</h2>
            <p className="mt-1 text-sm text-[#0d2137]/65">
              الطلبات بحالة «تم التوصيل» مع صورة Liefernachweis التي يرفعها السائق من رابط GPS.
            </p>
            {deliveredOrders.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center text-sm text-[#0d2137]/60">
                لا توجد طلبات مُسلَّمة بعد.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {deliveredOrders.map((o) => {
                  const podAt =
                    o.pod_completed_at != null
                      ? new Date(o.pod_completed_at).toLocaleString("ar-SA", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : null;
                  return (
                    <div
                      key={o.id}
                      className="flex flex-col overflow-hidden rounded-xl border-2 border-emerald-200/90 bg-white shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-emerald-100 bg-emerald-50/50 px-4 py-3">
                        <div>
                          <p className="font-mono text-sm font-bold text-[#0d2137]">
                            #{o.order_number ?? o.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-emerald-800">تم التوصيل</p>
                          {podAt && <p className="mt-0.5 text-[11px] text-[#0d2137]/65">تأكيد: {podAt}</p>}
                        </div>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="shrink-0 rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-800"
                        >
                          فتح الملف
                        </Link>
                      </div>
                      <div className="p-4">
                        <dl className="space-y-1.5 text-xs text-[#0d2137]/85">
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#0d2137]/55">الشركة</dt>
                            <dd className="max-w-[60%] text-left font-medium">{o.company_name}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#0d2137]/55">نوع الخدمة</dt>
                            <dd className="max-w-[60%] text-left">{serviceTypeCompanyRequestLabel(o.service_type)}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#0d2137]/55">العميل €</dt>
                            <dd className="font-semibold">{(o.price_cents / 100).toFixed(2)} €</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#0d2137]/55">السائق €</dt>
                            <dd>
                              {o.driver_price_cents != null ? (o.driver_price_cents / 100).toFixed(2) : "—"} €
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#0d2137]/55">الدفع</dt>
                            <dd>
                              {o.payment_status === "paid" ? (
                                <span className="text-emerald-700">مدفوع</span>
                              ) : (
                                <span className="text-amber-700">قيد الانتظار</span>
                              )}
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-4">
                          <p className="mb-2 text-xs font-semibold text-[#0d2137]/80">صورة إثبات التسليم</p>
                          {o.pod_photo_url ? (
                            <a
                              href={o.pod_photo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-lg border-2 border-emerald-200 bg-[#0d2137]/5"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={o.pod_photo_url}
                                alt="إثبات التسليم"
                                className="h-40 w-full object-cover object-center hover:opacity-95"
                              />
                            </a>
                          ) : (
                            <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3 py-4 text-center text-xs text-amber-900">
                              لا توجد صورة مرفوعة — يمكن إضافة رابط يدوياً من ملف الطلب.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
            </>
          )}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-[#0d2137]/70 shadow-lg">
          Keine Aufträge.
        </p>
      )}
    </div>
  );
}
