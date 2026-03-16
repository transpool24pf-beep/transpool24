"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { calculatePriceCents, formatPrice } from "@/lib/pricing";

const CARGO_OPTIONS = ["XS", "M", "L", "XL"] as const;
type CargoSize = (typeof CARGO_OPTIONS)[number];

const DEFAULT_KM = 50;

export type OrderFormData = {
  companyName: string;
  phone: string;
  pickupAddress: string;
  deliveryAddress: string;
  cargoSize: CargoSize;
  distanceKm: number;
};

const initial: OrderFormData = {
  companyName: "",
  phone: "",
  pickupAddress: "Pforzheim",
  deliveryAddress: "",
  cargoSize: "M",
  distanceKm: DEFAULT_KM,
};

export function OrderForm({ locale }: { locale: string }) {
  const t = useTranslations("order");
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OrderFormData>(initial);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceCents = calculatePriceCents(data.distanceKm, data.cargoSize);

  const update = (partial: Partial<OrderFormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
    setError(null);
  };

  const next = () => {
    if (step < 4) setStep((s) => s + 1);
  };

  const back = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: data.companyName,
          phone: data.phone,
          pickupAddress: data.pickupAddress,
          deliveryAddress: data.deliveryAddress,
          cargoSize: data.cargoSize,
          distanceKm: data.distanceKm,
          priceCents,
          locale,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Checkout failed");
      if (json.url) window.location.href = json.url;
      else throw new Error("No checkout URL");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 text-center text-green-800">
        <p className="font-medium">{t("success")}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
      <div className="mb-6 flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${
              s <= step ? "bg-[var(--accent)]" : "bg-[#0d2137]/10"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--primary)]">
            {t("step1")}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {t("companyName")}
            </label>
            <input
              type="text"
              value={data.companyName}
              onChange={(e) => update({ companyName: e.target.value })}
              placeholder={t("companyNamePlaceholder")}
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {t("phone")}
            </label>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder={t("phonePlaceholder")}
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--primary)]">
            {t("step2")}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {t("pickup")}
            </label>
            <input
              type="text"
              value={data.pickupAddress}
              onChange={(e) => update({ pickupAddress: e.target.value })}
              placeholder={t("pickupPlaceholder")}
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {t("delivery")}
            </label>
            <input
              type="text"
              value={data.deliveryAddress}
              onChange={(e) => update({ deliveryAddress: e.target.value })}
              placeholder={t("deliveryPlaceholder")}
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--primary)]">
            {t("step3")}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {t("cargoSize")}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CARGO_OPTIONS.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => update({ cargoSize: size })}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    data.cargoSize === size
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[#0d2137]/20 text-[var(--foreground)] hover:border-[#0d2137]/40"
                  }`}
                >
                  {t(`cargo${size}` as "cargoXS")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {t("distance")} (km)
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={data.distanceKm}
              onChange={(e) =>
                update({ distanceKm: Math.max(1, Number(e.target.value) || 1) })
              }
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div className="rounded-lg bg-[#0d2137]/5 p-4">
            <p className="text-sm text-[var(--foreground)]/80">{t("price")}</p>
            <p className="text-2xl font-bold text-[var(--accent)]">
              {formatPrice(priceCents)}
            </p>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--primary)]">
            {t("step4")}
          </h2>
          <div className="space-y-2 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/5 p-4 text-sm">
            <p><strong>{t("companyName")}:</strong> {data.companyName}</p>
            <p><strong>{t("phone")}:</strong> {data.phone}</p>
            <p><strong>{t("pickup")}:</strong> {data.pickupAddress}</p>
            <p><strong>{t("delivery")}:</strong> {data.deliveryAddress}</p>
            <p><strong>{t("cargoSize")}:</strong> {t(`cargo${data.cargoSize}` as "cargoXS")}</p>
            <p><strong>{t("distance")}:</strong> {data.distanceKm} km</p>
            <p className="pt-2 text-lg font-bold text-[var(--accent)]">
              {t("total")}: {formatPrice(priceCents)}
            </p>
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 1}
          className="rounded-lg border border-[#0d2137]/20 px-4 py-2 text-sm font-medium text-[var(--foreground)] disabled:opacity-50"
        >
          {t("back")}
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t("next")}
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePay}
            disabled={loading}
            className="rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-70"
          >
            {loading ? "…" : t("payNow")}
          </button>
        )}
      </div>
    </div>
  );
}
