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

const STATUS_CONFIG: Record<string, { labelDe: string; color: string; bg: string }> = {
  draft: { labelDe: "Entwurf", color: "text-slate-700", bg: "bg-slate-400" },
  confirmed: { labelDe: "Bestätigt", color: "text-blue-700", bg: "bg-blue-500" },
  paid: { labelDe: "Bezahlt", color: "text-emerald-700", bg: "bg-emerald-500" },
  assigned: { labelDe: "Zugewiesen", color: "text-amber-700", bg: "bg-amber-500" },
  in_transit: { labelDe: "Unterwegs", color: "text-violet-700", bg: "bg-violet-500" },
  delivered: { labelDe: "Zugestellt", color: "text-green-700", bg: "bg-green-500" },
  cancelled: { labelDe: "Storniert", color: "text-red-700", bg: "bg-red-500" },
};

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
    str((o.price_cents / 100).toFixed(2)).includes(s) ||
    (o.driver_price_cents != null && str((o.driver_price_cents / 100).toFixed(2)).includes(s)) ||
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

  const filtered = orders
    .filter((o) => (filter ? o.logistics_status === filter : true))
    .filter((o) => matchSearch(o, searchQuery));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0d2137]">Aufträge</h1>

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
          {Object.entries(STATUS_CONFIG).map(([value, { labelDe }]) => (
            <option key={value} value={value}>
              {labelDe}
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
                  <th className="w-[8%] px-2 py-3 font-semibold text-[#0d2137]">Kunde €</th>
                  <th className="w-[8%] px-2 py-3 font-semibold text-[#0d2137]">Fahrer €</th>
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
                            title={statusConf.labelDe}
                          />
                          <select
                            value={o.logistics_status}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            disabled={updating === o.id}
                            className={`rounded-lg border-2 bg-white px-2 py-1.5 text-xs font-medium ${statusConf.color} focus:border-[var(--accent)] focus:outline-none`}
                          >
                            {Object.entries(STATUS_CONFIG).map(([value, { labelDe }]) => (
                              <option key={value} value={value}>
                                {labelDe}
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

      {!loading && filtered.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-[#0d2137]/70 shadow-lg">
          Keine Aufträge.
        </p>
      )}
    </div>
  );
}
