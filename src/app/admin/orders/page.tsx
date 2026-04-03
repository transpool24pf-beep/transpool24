"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import {
  ADMIN_IN_PROGRESS_STATUS_SET,
  ADMIN_ORDER_STATUS_CONFIG,
  adminOrderStatusText,
} from "@/lib/admin-orders-status";
import { serviceTypeLabel, type AdminLocale } from "@/lib/admin-ui-strings";

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

function matchSearch(o: Job, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const str = (v: unknown) => (v == null ? "" : String(v)).toLowerCase();
  const statusLabelDe = ADMIN_ORDER_STATUS_CONFIG[o.logistics_status]?.labelDe ?? "";
  const statusLabelAr = ADMIN_ORDER_STATUS_CONFIG[o.logistics_status]?.labelAr ?? "";
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
    str(serviceTypeLabel("de", o.service_type)).includes(s) ||
    str(serviceTypeLabel("ar", o.service_type)).includes(s) ||
    str(o.service_type ?? "").includes(s)
  );
}

function LogisticsStatusPicker({
  jobId,
  logisticsStatus,
  disabled,
  locale,
  pickStatusAria,
  statusSummaryAria,
  onPick,
}: {
  jobId: string;
  logisticsStatus: string;
  disabled: boolean;
  locale: AdminLocale;
  pickStatusAria: string;
  statusSummaryAria: string;
  onPick: (id: string, status: string) => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const conf = ADMIN_ORDER_STATUS_CONFIG[logisticsStatus] ?? ADMIN_ORDER_STATUS_CONFIG.draft;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "text-right" : "text-left";

  return (
    <details ref={detailsRef} className="relative mx-auto w-full max-w-[6.25rem]" dir={dir}>
      <summary
        className={`flex cursor-pointer list-none items-center justify-center gap-1 rounded-full border-2 bg-white py-1 pe-1.5 ps-1 text-[11px] font-semibold leading-tight shadow-sm [&::-webkit-details-marker]:hidden ${conf.color} ${conf.pillBorder}`}
        title={`${conf.labelDe} / ${conf.labelAr}`}
        aria-label={`${statusSummaryAria}: ${adminOrderStatusText(locale, logisticsStatus)}`}
        aria-haspopup="listbox"
      >
        <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${conf.bg}`} aria-hidden />
        <span className="min-w-0 flex-1 truncate text-center">{adminOrderStatusText(locale, logisticsStatus)}</span>
        <span className="shrink-0 text-[8px] text-[#0d2137]/40" aria-hidden>
          ▾
        </span>
      </summary>
      <div
        className="absolute end-0 top-[calc(100%+6px)] z-50 min-w-[8.5rem] rounded-xl border-2 border-[#0d2137]/12 bg-white py-1 shadow-xl"
        role="listbox"
        aria-label={pickStatusAria}
      >
        {Object.entries(ADMIN_ORDER_STATUS_CONFIG).map(([value, c]) => (
          <button
            key={value}
            type="button"
            role="option"
            disabled={disabled}
            aria-selected={logisticsStatus === value}
            onClick={() => {
              if (value !== logisticsStatus) onPick(jobId, value);
              if (detailsRef.current) detailsRef.current.open = false;
            }}
            className={`flex w-full items-center gap-2 px-2.5 py-1.5 ${align} text-[11px] font-medium transition hover:bg-[#0d2137]/6 disabled:opacity-45 ${c.color} ${
              logisticsStatus === value ? "bg-[#0d2137]/8" : ""
            }`}
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.bg}`} />
            {locale === "ar" ? c.labelAr : c.labelDe}
          </button>
        ))}
      </div>
    </details>
  );
}

export default function AdminOrdersPage() {
  const { locale, t } = useAdminLocale();
  const dateLocale = locale === "ar" ? "ar-SA" : "de-DE";
  const [orders, setOrders] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sendingDeliveryEmailFor, setSendingDeliveryEmailFor] = useState<string | null>(null);

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

  const deleteOrder = (o: Job) => {
    const label = `#${o.order_number ?? o.id.slice(0, 8)}`;
    const msg = t("orders.deleteConfirm").replace("{order}", label);
    if (!window.confirm(msg)) return;
    setDeleting(o.id);
    fetch(`/api/admin/orders/${o.id}`, { method: "DELETE" })
      .then(async (r) => {
        if (!r.ok) {
          const data = (await r.json().catch(() => ({}))) as { error?: string };
          alert(data?.error ?? t("orders.deleteFailed"));
          return;
        }
        setOrders((prev) => prev.filter((x) => x.id !== o.id));
      })
      .catch(() => alert(t("orders.deleteFailed")))
      .finally(() => setDeleting(null));
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
    .filter((o) => ADMIN_IN_PROGRESS_STATUS_SET.has(o.logistics_status))
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
        <h1 className="text-2xl font-bold text-[#0d2137]">{t("orders.title")}</h1>
        {!loading && (
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/admin/orders/export"
              className="inline-flex w-fit items-center gap-2 rounded-xl border-2 border-[#0d2137]/20 bg-white px-4 py-2 text-sm font-semibold text-[#0d2137] shadow-sm hover:bg-[#0d2137]/5"
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              {t("orders.exportCsv")}
            </a>
            <a
              href="#admin-order-ops"
              className="inline-flex w-fit items-center gap-2 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-semibold text-[#0d2137] hover:bg-[var(--accent)]/20"
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              <span aria-hidden>↓</span>
              {t("orders.jumpToOps")}
            </a>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("orders.searchPlaceholder")}
          className="min-w-[220px] flex-1 rounded-xl border-2 border-[#0d2137]/15 bg-white px-4 py-2.5 text-sm text-[#0d2137] placeholder:text-[#0d2137]/50 shadow-sm transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border-2 border-[#0d2137]/15 bg-white px-4 py-2.5 text-sm font-medium text-[#0d2137] shadow-sm transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        >
          <option value="">{t("orders.filterAllStatus")}</option>
          {Object.entries(ADMIN_ORDER_STATUS_CONFIG).map(([value, c]) => (
            <option key={value} value={value}>
              {locale === "ar" ? c.labelAr : c.labelDe}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 shadow-lg">
          <p className="text-[#0d2137]/70">{t("orders.loading")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-[#0d2137]/10 bg-white shadow-lg">
          <div className="w-full min-w-[980px]">
            <table className="w-full table-fixed text-left text-sm">
              <thead>
                <tr className="border-b-2 border-[#0d2137]/10 bg-gradient-to-r from-[#0d2137]/10 to-[#0d2137]/5">
                  <th className="w-[11%] min-w-[7.5rem] px-2 py-3 font-semibold text-[#0d2137]">
                    {t("orders.colNr")}
                  </th>
                  <th
                    className="w-[7%] px-1 py-3 text-center font-semibold text-[#0d2137]"
                    dir={locale === "ar" ? "rtl" : "ltr"}
                  >
                    {t("orders.colStatus")}
                  </th>
                  <th className="w-[7%] px-2 py-3 font-semibold text-[#0d2137]">{t("orders.colDate")}</th>
                  <th className="w-[8%] px-2 py-3 font-semibold text-[#0d2137]">{t("orders.colCompany")}</th>
                  <th
                    className="w-[12%] px-2 py-3 font-semibold text-[#0d2137]"
                    dir={locale === "ar" ? "rtl" : "ltr"}
                  >
                    {t("orders.colService")}
                  </th>
                  <th className="w-[7%] px-2 py-3 font-semibold text-[#0d2137]">{t("orders.colCustomerEur")}</th>
                  <th className="w-[7%] px-2 py-3 font-semibold text-[#0d2137]">{t("orders.colDriverEur")}</th>
                  <th
                    className="w-[8%] px-2 py-3 font-semibold text-[#0d2137]"
                    dir={locale === "ar" ? "rtl" : "ltr"}
                  >
                    {t("orders.colAssistantEur")}
                  </th>
                  <th className="w-[7%] px-2 py-3 font-semibold text-[#0d2137]">{t("orders.colPayment")}</th>
                  <th
                    className="w-[10%] px-2 py-3 font-semibold text-[#0d2137]"
                    dir={locale === "ar" ? "rtl" : "ltr"}
                  >
                    {t("orders.colActions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, idx) => {
                  return (
                    <tr
                      key={o.id}
                      className={`border-b border-[#0d2137]/5 transition hover:bg-[#0d2137]/[0.02] ${
                        idx % 2 === 1 ? "bg-[#0d2137]/[0.02]" : ""
                      }`}
                    >
                      <td className="min-w-[7.5rem] whitespace-nowrap px-2 py-2 align-middle">
                        <div
                          className="inline-flex max-w-full items-center gap-2"
                          dir={locale === "ar" ? "rtl" : "ltr"}
                        >
                          <span className="font-mono text-xs font-semibold text-[#0d2137] tabular-nums">
                            {o.order_number ?? o.id.slice(0, 8)}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteOrder(o)}
                            disabled={deleting === o.id || updating === o.id}
                            title={t("orders.deleteAria")}
                            aria-label={t("orders.deleteAria")}
                            className="inline-flex h-7 min-h-[1.75rem] min-w-[1.75rem] shrink-0 items-center justify-center rounded-md border border-red-300 bg-red-50 text-lg font-bold leading-none text-red-700 shadow-sm transition hover:border-red-400 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <span aria-hidden className="-mt-px block">
                              ×
                            </span>
                          </button>
                        </div>
                      </td>
                      <td className="min-w-0 px-1 py-2 text-center">
                        <LogisticsStatusPicker
                          jobId={o.id}
                          logisticsStatus={o.logistics_status}
                          disabled={updating === o.id}
                          locale={locale}
                          pickStatusAria={t("orders.statusPick")}
                          statusSummaryAria={t("orders.statusAria")}
                          onPick={updateStatus}
                        />
                      </td>
                      <td className="min-w-0 px-2 py-2 text-[#0d2137]/80 text-xs">
                        {new Date(o.created_at).toLocaleDateString(dateLocale)}
                      </td>
                      <td className="min-w-0 truncate px-2 py-2 font-medium text-[#0d2137] text-xs" title={o.company_name}>
                        {o.company_name}
                      </td>
                      <td
                        className="min-w-0 px-2 py-2 text-xs font-medium text-[#0d2137] leading-snug"
                        dir={locale === "ar" ? "rtl" : "ltr"}
                        title={
                          locale === "ar"
                            ? serviceTypeLabel("de", o.service_type)
                            : serviceTypeLabel("ar", o.service_type)
                        }
                      >
                        {serviceTypeLabel(locale, o.service_type)}
                      </td>
                      <td
                        className="min-w-0 px-2 py-2 font-semibold text-[#0d2137] text-xs whitespace-nowrap"
                        title={t("orders.priceTitle")}
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
                            title={t("orders.assistantTitle")}
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
                          {o.payment_status === "paid" ? t("orders.paymentPaid") : t("orders.paymentPending")}
                        </span>
                      </td>
                      <td className="min-w-0 px-2 py-2" dir={locale === "ar" ? "rtl" : "ltr"}>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-[#0d2137] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0d2137]/90"
                        >
                          {t("orders.openFile")}
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
          dir={locale === "ar" ? "rtl" : "ltr"}
        >
          <p className="border-b border-[#0d2137]/10 pb-3 text-sm font-medium text-[#0d2137]/80">
            {t("orders.opsIntro")}
          </p>
          {orders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#0d2137]/25 bg-white p-8 text-center text-sm text-[#0d2137]/65">
              {t("orders.noOrders")}
            </p>
          ) : (
            <>
            <h2 className="text-xl font-bold text-[#0d2137]">{t("orders.inProgressTitle")}</h2>
            <p className="mt-1 text-sm text-[#0d2137]/65">
              {t("orders.inProgressDesc")}
            </p>
            {inProgressOrders.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-[#0d2137]/20 bg-white/80 p-6 text-center text-sm text-[#0d2137]/60">
                {t("orders.noInProgress")}
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                          <dd
                            className={`max-w-[65%] ${locale === "ar" ? "text-left" : "text-right"}`}
                          >
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
                            <dd className="text-[11px] leading-tight ltr:text-left rtl:text-left">{etaStr}</dd>
                          </div>
                        )}
                        {lastGpsStr && (
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#0d2137]/55">{t("orders.dtLastGps")}</dt>
                            <dd className="text-[11px] leading-tight ltr:text-left rtl:text-left">{lastGpsStr}</dd>
                          </div>
                        )}
                        <div className="border-t border-[#0d2137]/10 pt-2">
                          <dt className="text-[#0d2137]/55">{t("orders.dtPickup")}</dt>
                          <dd className="mt-0.5 text-[11px] leading-snug ltr:text-right rtl:text-left">
                            {o.pickup_address}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[#0d2137]/55">{t("orders.dtDelivery")}</dt>
                          <dd className="mt-0.5 text-[11px] leading-snug ltr:text-right rtl:text-left">
                            {o.delivery_address}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  );
                })}
              </div>
            )}

          <div className="pt-2">
            <h2 className="text-xl font-bold text-[#0d2137]">{t("orders.deliveredTitle")}</h2>
            <p className="mt-1 text-sm text-[#0d2137]/65">
              {t("orders.deliveredDesc")}
            </p>
            {deliveredOrders.length === 0 ? (
              <div className="mt-4 space-y-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center text-sm text-[#0d2137]/70">
                <p className="font-medium">{t("orders.noDeliveredTitle")}</p>
                <p className="text-xs leading-relaxed text-[#0d2137]/60">{t("orders.noDeliveredDesc")}</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {deliveredOrders.map((o) => {
                  const podAt =
                    o.pod_completed_at != null
                      ? new Date(o.pod_completed_at).toLocaleString(dateLocale, {
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
                          <p className="text-xs text-emerald-800">{t("orders.deliveredBadge")}</p>
                          {podAt && (
                            <p className="mt-0.5 text-[11px] text-[#0d2137]/65">
                              {t("orders.podAt")} {podAt}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="shrink-0 rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-800"
                        >
                          {t("orders.openFile")}
                        </Link>
                      </div>
                      <div className="p-4">
                        <dl className="space-y-1.5 text-xs text-[#0d2137]/85">
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#0d2137]/55">{t("orders.dtCompany")}</dt>
                            <dd
                              className={`max-w-[60%] font-medium ${locale === "ar" ? "text-left" : "text-right"}`}
                            >
                              {o.company_name}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#0d2137]/55">{t("orders.dtService")}</dt>
                            <dd
                              className={`max-w-[60%] ${locale === "ar" ? "text-left" : "text-right"}`}
                            >
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
                        </dl>
                        <div className="mt-4">
                          <p className="mb-2 text-xs font-semibold text-[#0d2137]/80">{t("orders.podPhoto")}</p>
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
                                alt={t("orders.podAlt")}
                                className="h-40 w-full object-cover object-center hover:opacity-95"
                              />
                            </a>
                          ) : (
                            <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3 py-4 text-center text-xs text-amber-900">
                              {t("orders.podNoPhoto")}
                            </p>
                          )}
                        </div>
                        <div className="mt-3 border-t border-emerald-100 pt-3">
                          <button
                            type="button"
                            disabled={
                              sendingDeliveryEmailFor === o.id ||
                              !o.customer_email?.trim()
                            }
                            title={
                              !o.customer_email?.trim()
                                ? t("orders.emailNoCustomer")
                                : t("orders.emailTitle")
                            }
                            onClick={async () => {
                              if (!o.customer_email?.trim()) {
                                alert(t("orders.alertNoEmail"));
                                return;
                              }
                              setSendingDeliveryEmailFor(o.id);
                              try {
                                const res = await fetch(
                                  `/api/admin/orders/${o.id}/send-delivery-confirmation-email`,
                                  { method: "POST" }
                                );
                                const data = (await res.json()) as { error?: string; sentTo?: string };
                                if (!res.ok) {
                                  alert(data?.error ?? t("orders.alertFail"));
                                  return;
                                }
                                alert(`${t("orders.alertSent")} ${data.sentTo ?? o.customer_email}`);
                              } catch {
                                alert(t("orders.alertNetwork"));
                              } finally {
                                setSendingDeliveryEmailFor(null);
                              }
                            }}
                            className="w-full rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {sendingDeliveryEmailFor === o.id
                              ? t("orders.emailSending")
                              : t("orders.emailBtn")}
                          </button>
                          {!o.customer_email?.trim() && (
                            <p className="mt-1 text-center text-[10px] text-amber-800">{t("orders.emailHint")}</p>
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
          {t("orders.noneFiltered")}
        </p>
      )}
    </div>
  );
}
