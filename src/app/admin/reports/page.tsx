"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import { adminOrderStatusText } from "@/lib/admin-orders-status";

type ArchiveOrder = {
  id: string;
  auftrag: string;
  company_name: string;
  phone: string;
  customer_email: string;
  pickup: string;
  delivery: string;
  recipient_phone: string;
  pickup_at: string | null;
  delivery_at: string | null;
  cargo_size: string;
  loads: string;
  distance_km: number | null;
  price_cents: number;
  driver_price_cents: number | null;
  payment_status: string;
  logistics_status: string;
  created_at: string;
  pod_completed_at: string | null;
  has_driver: boolean;
  hidden_from_orders?: boolean;
};

type ReportPayload = {
  totalOrders: number;
  revenueEur: string;
  byStatus: Record<string, number>;
  assignedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  cancelRatePercent: string;
  paidOrderCount: number;
  paidRevenueEur: string;
  byPayment: Record<string, number>;
  inTransitCount?: number;
  supportTickets7d?: number;
  archiveOrders?: ArchiveOrder[];
};

function fmtDt(iso: string | null, loc: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(loc, { dateStyle: "short", timeStyle: "short" });
}

export default function AdminReportsPage() {
  const { locale, t } = useAdminLocale();
  const dateLocale = locale === "ar" ? "ar-SA" : "de-DE";
  const [data, setData] = useState<ReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => {
        if (!r.ok) return r.json().then((j) => { throw new Error(j.error || r.statusText); });
        return r.json();
      })
      .then((j: ReportPayload) => setData(j))
      .catch((e) => setError(e instanceof Error ? e.message : t("common.error")))
      .finally(() => setLoading(false));
  }, [t]);

  const archive = data?.archiveOrders ?? [];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return archive;
    return archive.filter((o) =>
      [
        o.auftrag,
        o.company_name,
        o.phone,
        o.customer_email,
        o.pickup,
        o.delivery,
        o.recipient_phone,
        o.loads,
        o.logistics_status,
        o.payment_status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [archive, q]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-10 shadow-lg">
        <p className="text-[#0d2137]/70">{t("common.loading")}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-red-800">
        {error ?? t("reports.noData")}
      </div>
    );
  }

  const statusEntries = Object.entries(data.byStatus).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 text-start">
      <h1 className="text-2xl font-bold text-[#0d2137]">{t("reports.title")}</h1>
      <p className="text-sm text-[#0d2137]/70">{t("reports.subtitle")}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#0d2137]/50">{t("reports.totalOrders")}</p>
          <p className="mt-1 text-3xl font-bold text-[#0d2137]">{data.totalOrders}</p>
        </div>
        <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-900/70">{t("reports.inTransit")}</p>
          <p className="mt-1 text-3xl font-bold text-violet-900">{data.inTransitCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-700/70">{t("reports.support7d")}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{data.supportTickets7d ?? 0}</p>
          <p className="mt-1 text-xs text-slate-600/80">{t("reports.support7dHint")}</p>
        </div>
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/70">{t("reports.revenue")}</p>
          <p className="mt-1 text-3xl font-bold text-emerald-900">€ {data.revenueEur}</p>
          <p className="mt-1 text-xs text-emerald-800/70">{t("reports.revenueHint")}</p>
        </div>
        <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-900/70">{t("reports.paid")}</p>
          <p className="mt-1 text-3xl font-bold text-teal-900">{data.paidOrderCount ?? 0}</p>
          <p className="mt-1 text-xs text-teal-900/70">
            {t("reports.paidSum")}: € {data.paidRevenueEur ?? "0.00"}
          </p>
          <p className="mt-1 text-xs text-teal-800/60">{t("reports.paidHint")}</p>
        </div>
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-800/70">{t("reports.withDriver")}</p>
          <p className="mt-1 text-3xl font-bold text-blue-900">{data.assignedCount}</p>
        </div>
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-900/70">{t("reports.cancelRate")}</p>
          <p className="mt-1 text-3xl font-bold text-amber-900">{data.cancelRatePercent}%</p>
          <p className="mt-1 text-xs text-amber-900/60">
            {t("reports.cancelled")}: {data.cancelledCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#0d2137]/15 bg-white p-6 shadow-lg">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#0d2137]">{t("reports.archiveTitle")}</h2>
            <p className="mt-1 text-sm text-[#0d2137]/70">{t("reports.archiveDesc")}</p>
            <p className="mt-1 text-xs font-medium text-[#0d2137]/50">
              {t("reports.archiveCount").replace("{n}", String(filtered.length))}
            </p>
          </div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("reports.archiveSearch")}
            className="w-full max-w-sm rounded-xl border-2 border-[#0d2137]/15 bg-white px-3 py-2 text-sm text-[#0d2137] placeholder:text-[#0d2137]/45 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
          />
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-[#0d2137]/60">{t("reports.archiveEmpty")}</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => {
              const open = openId === o.id;
              const paid = o.payment_status === "paid";
              return (
                <article key={o.id} className="overflow-hidden rounded-xl border border-[#0d2137]/12 bg-[#f8fafc]">
                  <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-mono text-sm font-bold text-[#0d2137]">{o.auftrag}</p>
                      {o.hidden_from_orders ? (
                        <p className="text-xs font-semibold text-amber-800">{t("reports.hiddenFromOrders")}</p>
                      ) : null}
                      <p className="font-medium text-[#0d2137]">{o.company_name || t("common.none")}</p>
                      <p className="text-xs text-[#0d2137]/65">
                        {adminOrderStatusText(locale, o.logistics_status)}
                        {" · "}
                        {o.payment_status === "paid" ? t("orders.paymentPaid") : t("orders.paymentPending")}
                        {" · "}
                        {new Date(o.created_at).toLocaleDateString(dateLocale)}
                        {" · "}
                        <span dir="ltr">€ {(o.price_cents / 100).toFixed(2)}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : o.id)}
                        className="rounded-lg border border-[#0d2137]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#0d2137] hover:bg-[#0d2137]/5"
                      >
                        {t("reports.details")}
                      </button>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="rounded-lg bg-[#0d2137] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0d2137]/90"
                      >
                        {t("common.open")}
                      </Link>
                      <a
                        href={`/api/admin/orders/${encodeURIComponent(o.id)}/driver-sheet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[#0d2137]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#0d2137] hover:bg-[#0d2137]/5"
                      >
                        {t("reports.driverSheet")}
                      </a>
                      {paid ? (
                        <a
                          href={`/api/admin/invoice?job_id=${encodeURIComponent(o.id)}&type=customer`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                        >
                          {t("reports.invoicePdf")}
                        </a>
                      ) : null}
                    </div>
                  </div>
                  {open ? (
                    <dl className="grid gap-3 border-t border-[#0d2137]/10 bg-white px-4 py-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-[#0d2137]/50">{t("common.phone")}</dt>
                        <dd className="mt-0.5 font-medium" dir="ltr">{o.phone || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#0d2137]/50">{t("common.email")}</dt>
                        <dd className="mt-0.5 break-all font-medium">{o.customer_email || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#0d2137]/50">{t("reports.colPickup")}</dt>
                        <dd className="mt-0.5 whitespace-pre-line">{o.pickup || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#0d2137]/50">{t("reports.colDelivery")}</dt>
                        <dd className="mt-0.5 whitespace-pre-line">{o.delivery || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#0d2137]/50">{t("reports.colRecipientPhone")}</dt>
                        <dd className="mt-0.5" dir="ltr">{o.recipient_phone || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#0d2137]/50">{t("reports.colPickupTime")}</dt>
                        <dd className="mt-0.5">{fmtDt(o.pickup_at, dateLocale)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#0d2137]/50">{t("reports.colDeliveryTime")}</dt>
                        <dd className="mt-0.5">{fmtDt(o.delivery_at, dateLocale)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#0d2137]/50">{t("reports.colCargo")}</dt>
                        <dd className="mt-0.5 whitespace-pre-line">
                          {o.cargo_size}
                          {o.loads ? `\n${o.loads}` : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#0d2137]/50">{t("reports.colDistance")}</dt>
                        <dd className="mt-0.5">{o.distance_km != null ? `${o.distance_km} km` : "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#0d2137]/50">{t("reports.colAmount")}</dt>
                        <dd className="mt-0.5 font-semibold" dir="ltr">€ {(o.price_cents / 100).toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#0d2137]/50">{t("reports.withDriver")}</dt>
                        <dd className="mt-0.5">{o.has_driver ? t("common.yes") : t("common.no")}</dd>
                      </div>
                      {o.pod_completed_at ? (
                        <div>
                          <dt className="text-xs text-[#0d2137]/50">{t("reports.delivered")}</dt>
                          <dd className="mt-0.5">{fmtDt(o.pod_completed_at, dateLocale)}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">{t("reports.byLogistics")}</h2>
          <ul className="space-y-2 text-sm">
            {statusEntries.map(([st, n]) => (
              <li key={st} className="flex justify-between border-b border-[#0d2137]/10 py-2 last:border-0">
                <span className="font-mono text-[#0d2137]/80" dir="ltr">
                  {st}
                </span>
                <span className="font-semibold text-[#0d2137]">{n}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">{t("reports.delivery")}</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#0d2137]/60">{t("reports.delivered")}</dt>
              <dd className="font-semibold text-green-800">{data.deliveredCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#0d2137]/60">{t("reports.cancelled")}</dt>
              <dd className="font-semibold text-red-800">{data.cancelledCount}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">{t("reports.byPayment")}</h2>
        <ul className="space-y-2 text-sm">
          {Object.entries(data.byPayment ?? {})
            .sort((a, b) => b[1] - a[1])
            .map(([st, n]) => (
              <li key={st} className="flex justify-between border-b border-[#0d2137]/10 py-2 last:border-0">
                <span className="font-mono text-[#0d2137]/80" dir="ltr">
                  {st}
                </span>
                <span className="font-semibold text-[#0d2137]">{n}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
