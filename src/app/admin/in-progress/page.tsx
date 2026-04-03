"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import {
  ADMIN_IN_PROGRESS_STATUS_SET,
  ADMIN_ORDER_STATUS_CONFIG,
  adminOrderStatusText,
} from "@/lib/admin-orders-status";
import { serviceTypeLabel } from "@/lib/admin-ui-strings";

type Job = {
  id: string;
  order_number: number | null;
  company_name: string;
  pickup_address: string;
  delivery_address: string;
  service_type?: string;
  distance_km: number | null;
  duration_minutes?: number | null;
  price_cents: number;
  driver_price_cents: number | null;
  payment_status: string;
  logistics_status: string;
  created_at: string;
  estimated_arrival_at?: string | null;
  eta_minutes_remaining?: number | null;
  last_driver_location_at?: string | null;
};

export default function AdminInProgressPage() {
  const { locale, t } = useAdminLocale();
  const dateLocale = locale === "ar" ? "ar-SA" : "de-DE";
  const [orders, setOrders] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const inProgressOrders = useMemo(
    () =>
      orders
        .filter((o) => ADMIN_IN_PROGRESS_STATUS_SET.has(o.logistics_status))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [orders],
  );

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale === "ar" ? "ar" : "de"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2137]">{t("inProgress.title")}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#0d2137]/75">{t("inProgress.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="rounded-xl border-2 border-[#0d2137]/20 bg-white px-4 py-2 text-sm font-semibold text-[#0d2137] hover:bg-[#0d2137]/5 disabled:opacity-50"
          >
            {t("inProgress.refresh")}
          </button>
          <Link
            href="/admin/orders"
            className="inline-flex items-center rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-semibold text-[#0d2137] hover:bg-[var(--accent)]/20"
          >
            {t("inProgress.linkAll")}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-10 shadow-lg">
          <p className="text-[#0d2137]/70">{t("inProgress.loading")}</p>
        </div>
      ) : inProgressOrders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-10 text-center shadow-sm">
          <p className="text-[#0d2137]/80">{t("inProgress.empty")}</p>
          <Link href="/admin/orders" className="mt-4 inline-block font-medium text-[var(--accent)] hover:underline">
            {t("inProgress.linkAll")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {inProgressOrders.map((o) => {
            const st = ADMIN_ORDER_STATUS_CONFIG[o.logistics_status] ?? ADMIN_ORDER_STATUS_CONFIG.draft;
            const etaStr =
              o.estimated_arrival_at != null
                ? new Date(o.estimated_arrival_at).toLocaleString(dateLocale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : null;
            const lastGpsStr =
              o.last_driver_location_at != null
                ? new Date(o.last_driver_location_at).toLocaleString(dateLocale, {
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
                      {adminOrderStatusText(locale, o.logistics_status)}
                    </span>
                  </div>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="shrink-0 rounded-lg bg-[#0d2137] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#0d2137]/90"
                  >
                    {t("orders.openFile")}
                  </Link>
                </div>
                <dl className="mt-3 space-y-1.5 text-xs text-[#0d2137]/85">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#0d2137]/55">{t("orders.dtCompany")}</dt>
                    <dd
                      className={`max-w-[65%] font-medium ${locale === "ar" ? "text-left" : "text-right"}`}
                    >
                      {o.company_name}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#0d2137]/55">{t("orders.dtService")}</dt>
                    <dd className={`max-w-[65%] ${locale === "ar" ? "text-left" : "text-right"}`}>
                      {serviceTypeLabel(locale, o.service_type)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#0d2137]/55">{t("orders.dtCustomerEur")}</dt>
                    <dd className="font-semibold">{(o.price_cents / 100).toFixed(2)} €</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#0d2137]/55">{t("orders.dtDriverEur")}</dt>
                    <dd>
                      {o.driver_price_cents != null ? (o.driver_price_cents / 100).toFixed(2) : "—"} €
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#0d2137]/55">{t("orders.dtPayment")}</dt>
                    <dd>
                      {o.payment_status === "paid" ? (
                        <span className="text-emerald-700">{t("orders.paymentPaid")}</span>
                      ) : (
                        <span className="text-amber-700">{t("orders.paymentPending")}</span>
                      )}
                    </dd>
                  </div>
                  {o.distance_km != null && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#0d2137]/55">{t("orders.dtDistance")}</dt>
                      <dd>{o.distance_km} km</dd>
                    </div>
                  )}
                  {o.duration_minutes != null && o.duration_minutes > 0 && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#0d2137]/55">{t("orders.dtDuration")}</dt>
                      <dd>{o.duration_minutes}</dd>
                    </div>
                  )}
                  {o.eta_minutes_remaining != null && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#0d2137]/55">{t("orders.dtEtaMin")}</dt>
                      <dd>{o.eta_minutes_remaining}</dd>
                    </div>
                  )}
                  {etaStr && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#0d2137]/55">{t("orders.dtEta")}</dt>
                      <dd className="text-[11px] leading-tight">{etaStr}</dd>
                    </div>
                  )}
                  {lastGpsStr && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#0d2137]/55">{t("orders.dtLastGps")}</dt>
                      <dd className="text-[11px] leading-tight">{lastGpsStr}</dd>
                    </div>
                  )}
                  <div className="border-t border-[#0d2137]/10 pt-2">
                    <dt className="text-[#0d2137]/55">{t("orders.dtPickup")}</dt>
                    <dd className="mt-0.5 text-[11px] leading-snug">{o.pickup_address}</dd>
                  </div>
                  <div>
                    <dt className="text-[#0d2137]/55">{t("orders.dtDelivery")}</dt>
                    <dd className="mt-0.5 text-[11px] leading-snug">{o.delivery_address}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
