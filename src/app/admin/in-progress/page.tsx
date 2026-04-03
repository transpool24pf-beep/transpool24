"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminLocale } from "@/lib/admin-ui-strings";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import {
  ADMIN_IN_PROGRESS_STATUS_SET,
  ADMIN_ORDER_STATUS_CONFIG,
  adminOrderStatusText,
} from "@/lib/admin-orders-status";
import { serviceTypeLabel } from "@/lib/admin-ui-strings";

/** Show red pulsing alert when remaining time is at or below this (minutes). */
const IN_PROGRESS_DANGER_MINUTES = 30;

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
  driver_whatsapp_phone?: string | null;
  driver_whatsapp_full_name?: string | null;
};

function deadlineMs(o: Job): number | null {
  if (o.estimated_arrival_at) {
    const t = new Date(o.estimated_arrival_at).getTime();
    if (!Number.isNaN(t)) return t;
  }
  if (o.duration_minutes != null && o.duration_minutes > 0) {
    const c = new Date(o.created_at).getTime();
    if (!Number.isNaN(c)) return c + o.duration_minutes * 60_000;
  }
  return null;
}

function waPhoneDigits(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("0")) d = `49${d.slice(1)}`;
  return d;
}

function buildWhatsappPodReminderDe(
  orderRef: string,
  remainingMs: number | null,
  driverFullName: string | null
): string {
  const name = (driverFullName ?? "").trim();
  const greeting = name ? `Hallo ${name},` : "Guten Tag,";

  let podLine: string;
  if (remainingMs == null) {
    podLine =
      "Bitte senden Sie die Zustellfotos (Liefernachweis / POD) rechtzeitig über den vorgegebenen Link bzw. die App.";
  } else if (remainingMs <= 0) {
    podLine =
      "Die voraussichtliche Zeit ist erreicht oder überschritten. Bitte senden Sie die Zustellfotos (Liefernachweis / POD) umgehend.";
  } else {
    const totalMin = Math.max(1, Math.ceil(remainingMs / 60_000));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const hm =
      h > 0
        ? `etwa ${h} Stunde(n) und ${m} Minute(n)`
        : `etwa ${m} Minute(n)`;
    podLine = `Restzeit laut System: ${hm}. Bitte reichen Sie die Zustellfotos (Liefernachweis / POD) rechtzeitig ein.`;
  }

  return `${greeting}

vielen Dank für Ihren Einsatz! Hier eine kurze Erinnerung von TransPool24 zum Auftrag #${orderRef}.

${podLine}

Bitte achten Sie unterwegs besonders auf Ihre Sicherheit und fahren Sie vorsichtig.

Mit freundlichen Grüßen
Ihr TransPool24-Team`;
}

/** Always show H:MM:SS (hours may exceed 99). Used for remaining and overdue (absolute value). */
function formatHoursMinutesSeconds(absMs: number): string {
  const secTotal = Math.floor(absMs / 1000);
  const h = Math.floor(secTotal / 3600);
  const m = Math.floor((secTotal % 3600) / 60);
  const s = secTotal % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function InProgressOrderCard({
  o,
  dateLocale,
  locale,
  t,
}: {
  o: Job;
  dateLocale: string;
  locale: AdminLocale;
  t: (key: string) => string;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const end = useMemo(() => deadlineMs(o), [o]);
  const remainingMs = end != null ? end - Date.now() : null;
  const dangerThresholdMs = IN_PROGRESS_DANGER_MINUTES * 60_000;
  const isDanger =
    end != null &&
    (remainingMs == null || remainingMs <= dangerThresholdMs);

  const orderRef = String(o.order_number ?? o.id.slice(0, 8));
  const rawPhone = (o.driver_whatsapp_phone ?? "").trim();
  const waDigits = rawPhone ? waPhoneDigits(rawPhone) : null;
  const driverName = (o.driver_whatsapp_full_name ?? "").trim() || null;
  const waHref =
    waDigits != null
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent(buildWhatsappPodReminderDe(orderRef, remainingMs, driverName))}`
      : null;

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
      className={`flex flex-col rounded-xl border-2 bg-white p-4 shadow-sm transition ${
        isDanger ? "border-red-500 ring-2 ring-red-400/60 animate-pulse" : "border-violet-200/80 hover:border-violet-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-[#0d2137]/10 pb-2">
        <div>
          <p className="font-mono text-sm font-bold text-[#0d2137]">#{orderRef}</p>
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

      <div
        className={`mt-3 rounded-lg border-2 px-2.5 py-2 ${
          isDanger
            ? "border-red-600 bg-red-50 text-red-950"
            : "border-[#0d2137]/15 bg-slate-50/80 text-[#0d2137]"
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{t("inProgress.countdown")}</p>
        {end == null ? (
          <>
            <p className="mt-0.5 font-mono text-lg font-bold tabular-nums">—</p>
            <p className="mt-1 text-[10px] leading-snug opacity-80">{t("inProgress.noDeadline")}</p>
          </>
        ) : remainingMs != null ? (
          <>
            <p className="mt-0.5 font-mono text-2xl font-bold tabular-nums leading-tight tracking-tight">
              {remainingMs < 0 ? <span className="text-red-700">−</span> : null}
              {formatHoursMinutesSeconds(Math.abs(remainingMs))}
            </p>
            <p className={`mt-1 text-[11px] font-medium ${remainingMs < 0 ? "text-red-800" : "text-[#0d2137]/80"}`}>
              {remainingMs < 0 ? t("inProgress.overdueCaption") : t("inProgress.remainingCaption")}
            </p>
            {remainingMs < 0 && (
              <p className="mt-0.5 text-[10px] font-semibold text-red-900">{t("inProgress.overdue")}</p>
            )}
          </>
        ) : (
          <p className="mt-0.5 font-mono text-lg font-bold tabular-nums">—</p>
        )}
        {isDanger && end != null && remainingMs != null && (
          <p className="mt-2 text-[10px] font-medium leading-snug text-red-900">{t("inProgress.dangerHint")}</p>
        )}
      </div>

      {waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#20bd5a]"
        >
          <span aria-hidden>{"\u2197"}</span>
          {t("inProgress.whatsappDriver")}
        </a>
      ) : (
        <p className="mt-3 text-center text-[10px] text-[#0d2137]/50">{t("inProgress.whatsappMissing")}</p>
      )}

      <dl className="mt-3 space-y-1.5 text-xs text-[#0d2137]/85">
        <div className="flex justify-between gap-2">
          <dt className="text-[#0d2137]/55">{t("orders.dtCompany")}</dt>
          <dd className={`max-w-[65%] font-medium ${locale === "ar" ? "text-left" : "text-right"}`}>
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
          <dd>{o.driver_price_cents != null ? (o.driver_price_cents / 100).toFixed(2) : "—"} €</dd>
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
}

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

  const inProgressOrders = useMemo(() => {
    const list = orders.filter((o) => ADMIN_IN_PROGRESS_STATUS_SET.has(o.logistics_status));
    /** Soonest deadline first (most urgent); no deadline last. */
    return list.sort((a, b) => {
      const da = deadlineMs(a);
      const db = deadlineMs(b);
      if (da == null && db == null) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
  }, [orders]);

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
          {inProgressOrders.map((o) => (
            <InProgressOrderCard key={o.id} o={o} dateLocale={dateLocale} locale={locale} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
