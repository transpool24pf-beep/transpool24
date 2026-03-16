"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/pricing";

type Job = {
  id: string;
  company_name: string;
  pickup_address: string;
  pickup_city: string | null;
  delivery_address: string;
  delivery_city: string | null;
  cargo_size: string;
  distance_km: number | null;
  price_cents: number;
  phone: string;
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
  const [payLoading, setPayLoading] = useState(false);

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

  const handlePay = async () => {
    if (!jobId || !token) return;
    setPayLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, token, locale }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Checkout failed");
      if (json.url) window.location.href = json.url;
      else throw new Error("No checkout URL");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPayLoading(false);
    }
  };

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
        <p><strong>{t("orderRef")}:</strong> <code className="font-mono text-xs">{job.id}</code></p>
        <p><strong>{t("companyName")}:</strong> {job.company_name}</p>
        <p><strong>{t("phone")}:</strong> {job.phone}</p>
        <p><strong>{t("pickup")}:</strong> {job.pickup_address}{job.pickup_city ? `, ${job.pickup_city}` : ""}</p>
        <p><strong>{t("delivery")}:</strong> {job.delivery_address}{job.delivery_city ? `, ${job.delivery_city}` : ""}</p>
        <p><strong>{t("cargoSize")}:</strong> {job.cargo_size}</p>
        <p><strong>{t("distance")}:</strong> {job.distance_km ?? "—"} km</p>
        <p className="pt-2 text-lg font-bold text-[var(--accent)]">
          {t("total")}: {formatPrice(job.price_cents)}
        </p>
      </div>

      <div className="rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/5 p-4">
        <h3 className="mb-2 text-sm font-semibold text-[var(--primary)]">
          {t("driverInfo")}
        </h3>
        <p className="text-sm text-[var(--foreground)]/80">{t("driverTba")}</p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={handlePay}
          disabled={payLoading}
          className="w-full rounded-lg bg-[var(--accent)] px-6 py-3 text-base font-medium text-white hover:opacity-90 disabled:opacity-70"
        >
          {payLoading ? "…" : t("payNow")}
        </button>
      </div>
    </div>
  );
}
