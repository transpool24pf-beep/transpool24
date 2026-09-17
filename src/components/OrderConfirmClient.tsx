"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { GermanVatPriceBlock } from "@/components/GermanVatPriceBlock";
import { formatStructuredAddressPlain, jobPreferredDeliveryAt, jobRecipientAddress, jobSenderAddress } from "@/lib/structured-address";
import { displayOrderRef } from "@/lib/order-ref";

type Job = {
  id: string;
  order_number?: number | null;
  company_name: string;
  pickup_address: string;
  pickup_city: string | null;
  delivery_address: string;
  delivery_city: string | null;
  cargo_size: string;
  distance_km: number | null;
  price_cents: number;
  phone: string;
  preferred_pickup_at?: string | null;
  preferred_delivery_at?: string | null;
  cargo_details?: Record<string, unknown> | null;
};

export function OrderConfirmClient({
  jobId,
  token,
  locale,
}: {
  jobId: string | null;
  token: string | null;
  locale: string;
}) {
  const t = useTranslations("order");
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || !token) {
      setError("Missing link parameters");
      setLoading(false);
      return;
    }
    fetch(`/api/orders/confirm?job_id=${encodeURIComponent(jobId)}&token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || "Failed"); });
        return res.json();
      })
      .then((data) => {
        setJob(data.job);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Invalid or expired link");
      })
      .finally(() => setLoading(false));
  }, [jobId, token]);

  if (loading) {
    return (
      <div className="rounded-xl border border-[#0d2137]/10 bg-white p-8 text-center">
        <p className="text-[var(--foreground)]/70">{t("loading")}</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-medium text-red-800">{error ?? t("invalidLink")}</p>
        <a
          href={`/${locale}/order`}
          className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t("backToOrder")}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--primary)]">
        {t("confirmPageTitle")}
      </h2>

      <div className="space-y-2 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/5 p-4 text-sm">
        <p><strong>{t("orderRef")}:</strong> <code className="font-mono text-xs">{displayOrderRef(job) || "—"}</code></p>
        <p><strong>{t("companyName")}:</strong> {job.company_name}</p>
        <p><strong>{t("phone")}:</strong> {job.phone}</p>
        <p className="whitespace-pre-line"><strong>{t("pickup")}:</strong> {formatStructuredAddressPlain(jobSenderAddress(job), false) || `${job.pickup_address}${job.pickup_city ? `, ${job.pickup_city}` : ""}`}</p>
        {job.preferred_pickup_at ? (
          <p><strong>{t("pickupDate")} / {t("pickupTime")}:</strong> {new Date(job.preferred_pickup_at).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}</p>
        ) : null}
        {jobSenderAddress(job).notes.trim() ? (
          <p className="whitespace-pre-line"><strong>{t("addressLoadingNotes")}:</strong> {jobSenderAddress(job).notes.trim()}</p>
        ) : null}
        <p className="whitespace-pre-line"><strong>{t("delivery")}:</strong> {formatStructuredAddressPlain(jobRecipientAddress(job), false) || `${job.delivery_address}${job.delivery_city ? `, ${job.delivery_city}` : ""}`}</p>
        {jobRecipientAddress(job).phone.trim() ? (
          <p><strong>{t("recipientPhone")}:</strong> {jobRecipientAddress(job).phone.trim()}</p>
        ) : null}
        {jobPreferredDeliveryAt(job) ? (
          <p><strong>{t("deliveryDate")} / {t("deliveryTime")}:</strong> {new Date(jobPreferredDeliveryAt(job)!).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}</p>
        ) : null}
        {jobRecipientAddress(job).notes.trim() ? (
          <p className="whitespace-pre-line"><strong>{t("addressUnloadingNotes")}:</strong> {jobRecipientAddress(job).notes.trim()}</p>
        ) : null}
        <p><strong>{t("cargoSize")}:</strong> {job.cargo_size}</p>
        <p><strong>{t("distance")}:</strong> {job.distance_km ?? "-"} km</p>
        <div className="pt-2">
          <GermanVatPriceBlock grossCents={job.price_cents} />
        </div>
      </div>

      <div className="rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/5 p-4">
        <h3 className="mb-2 text-sm font-semibold text-[var(--primary)]">
          {t("driverInfo")}
        </h3>
        <p className="text-sm text-[var(--foreground)]/80">{t("driverTba")}</p>
      </div>

      <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        {t("invoiceAfterDelivery")}
      </p>
    </div>
  );
}
