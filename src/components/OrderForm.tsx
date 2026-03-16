"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { calculatePriceCents, formatPrice } from "@/lib/pricing";

type Suggestion = { display_name: string; lat: number; lon: number };

const CARGO_OPTIONS = ["XS", "M", "L"] as const;
type CargoSize = (typeof CARGO_OPTIONS)[number];

const DEFAULT_KM = 50;

export type OrderFormData = {
  companyName: string;
  email: string;
  phone: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupTime: string;
  cargoSize: CargoSize;
  distanceKm: number;
};

const initial: OrderFormData = {
  companyName: "",
  email: "",
  phone: "",
  pickupAddress: "Pforzheim",
  deliveryAddress: "",
  pickupTime: "",
  cargoSize: "M",
  distanceKm: DEFAULT_KM,
};

export function OrderForm({ locale }: { locale: string }) {
  const t = useTranslations("order");
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OrderFormData>(initial);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<{ jobId: string; token: string; whatsappLink: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [deliverySuggestions, setDeliverySuggestions] = useState<Suggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState<"pickup" | "delivery" | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const priceCents = calculatePriceCents(data.distanceKm, data.cargoSize);

  const fetchSuggestions = useCallback((query: string, setter: (s: Suggestion[]) => void) => {
    if (query.length < 3) {
      setter([]);
      return;
    }
    fetch(`/api/address-suggestions?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then(setter)
      .catch(() => setter([]));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (suggestionsOpen === "pickup") {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(data.pickupAddress, setPickupSuggestions);
      }, 300);
    } else if (suggestionsOpen === "delivery") {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(data.deliveryAddress, setDeliverySuggestions);
      }, 300);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data.pickupAddress, data.deliveryAddress, suggestionsOpen, fetchSuggestions]);

  const fetchRealDistance = useCallback(async () => {
    if (!data.pickupAddress.trim() || !data.deliveryAddress.trim()) return;
    setDistanceLoading(true);
    try {
      const res = await fetch(
        `/api/route-distance?pickup=${encodeURIComponent(data.pickupAddress)}&delivery=${encodeURIComponent(data.deliveryAddress)}`
      );
      const json = await res.json();
      if (res.ok && typeof json.distanceKm === "number" && json.distanceKm > 0) {
        update({ distanceKm: Math.round(json.distanceKm * 10) / 10 });
      }
    } finally {
      setDistanceLoading(false);
    }
  }, [data.pickupAddress, data.deliveryAddress]);

  const update = (partial: Partial<OrderFormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
    setError(null);
  };

  const next = () => {
    if (step < 4) {
      if (step === 2 && data.pickupAddress.trim() && data.deliveryAddress.trim()) {
        setDistanceLoading(true);
        fetchRealDistance().finally(() => {
          setDistanceLoading(false);
          setStep((s) => s + 1);
        });
      } else {
        setStep((s) => s + 1);
      }
    }
  };

  const back = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleConfirmOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/confirm-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: data.companyName,
          email: data.email,
          phone: data.phone,
          pickupAddress: data.pickupAddress,
          deliveryAddress: data.deliveryAddress,
          pickupTime: data.pickupTime || null,
          cargoSize: data.cargoSize,
          distanceKm: data.distanceKm,
          priceCents,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to confirm order");
      if (json.jobId && json.confirmationToken && json.whatsappLink) {
        setOrderConfirmed({
          jobId: json.jobId,
          token: json.confirmationToken,
          whatsappLink: json.whatsappLink,
        });
      } else {
        throw new Error("Invalid response");
      }
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
              {t("email")}
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder={t("emailPlaceholder")}
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
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {t("pickup")}
            </label>
            <input
              type="text"
              value={data.pickupAddress}
              onChange={(e) => {
                update({ pickupAddress: e.target.value });
                setSuggestionsOpen("pickup");
              }}
              onFocus={() => setSuggestionsOpen("pickup")}
              onBlur={() => setTimeout(() => setSuggestionsOpen(null), 200)}
              placeholder={t("pickupPlaceholder")}
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            {suggestionsOpen === "pickup" && pickupSuggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[#0d2137]/20 bg-white py-1 shadow-lg">
                {pickupSuggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm hover:bg-[#0d2137]/5"
                      onMouseDown={() => {
                        update({ pickupAddress: s.display_name });
                        setPickupSuggestions([]);
                        setSuggestionsOpen(null);
                      }}
                    >
                      {s.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {t("delivery")}
            </label>
            <input
              type="text"
              value={data.deliveryAddress}
              onChange={(e) => {
                update({ deliveryAddress: e.target.value });
                setSuggestionsOpen("delivery");
              }}
              onFocus={() => setSuggestionsOpen("delivery")}
              onBlur={() => setTimeout(() => setSuggestionsOpen(null), 200)}
              placeholder={t("deliveryPlaceholder")}
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            {suggestionsOpen === "delivery" && deliverySuggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[#0d2137]/20 bg-white py-1 shadow-lg">
                {deliverySuggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm hover:bg-[#0d2137]/5"
                      onMouseDown={() => {
                        update({ deliveryAddress: s.display_name });
                        setDeliverySuggestions([]);
                        setSuggestionsOpen(null);
                      }}
                    >
                      {s.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {t("pickupTime")}
            </label>
            <input
              type="datetime-local"
              value={data.pickupTime}
              onChange={(e) => update({ pickupTime: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
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
              step={0.1}
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

      {step === 4 && !orderConfirmed && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--primary)]">
            {t("step4")}
          </h2>
          <div className="space-y-2 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/5 p-4 text-sm">
            <p><strong>{t("companyName")}:</strong> {data.companyName}</p>
            <p><strong>{t("email")}:</strong> {data.email}</p>
            <p><strong>{t("phone")}:</strong> {data.phone}</p>
            <p><strong>{t("pickup")}:</strong> {data.pickupAddress}</p>
            <p><strong>{t("delivery")}:</strong> {data.deliveryAddress}</p>
            {data.pickupTime && (
              <p><strong>{t("pickupTime")}:</strong> {new Date(data.pickupTime).toLocaleString()}</p>
            )}
            <p><strong>{t("cargoSize")}:</strong> {t(`cargo${data.cargoSize}` as "cargoXS")}</p>
            <p><strong>{t("distance")}:</strong> {data.distanceKm} km</p>
            <p className="pt-2 text-lg font-bold text-[var(--accent)]">
              {t("total")}: {formatPrice(priceCents)}
            </p>
          </div>
          <div className="rounded-lg border border-[#0d2137]/15 bg-[#0d2137]/5 p-4">
            <p className="text-sm text-[var(--foreground)] leading-relaxed">
              {t("confirmMessage")}
            </p>
            <label className="mt-3 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#0d2137]/30 text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-sm font-medium text-[var(--foreground)]">
                {t("confirmCheckboxLabel")}
              </span>
            </label>
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      )}

      {step === 4 && orderConfirmed && (
        <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-6 text-[var(--primary)]">
          <p className="font-medium text-green-800">{t("confirmedSuccess")}</p>
          <p className="text-sm text-green-700">
            {t("orderRef")}: <code className="rounded bg-green-100 px-1 font-mono text-xs">{orderConfirmed.jobId}</code>
          </p>
          <a
            href={orderConfirmed.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-800 shadow-sm hover:bg-green-50"
          >
            {t("shareToDrivers")}
          </a>
          <a
            href={`/${locale}/order/confirm?job_id=${encodeURIComponent(orderConfirmed.jobId)}&token=${encodeURIComponent(orderConfirmed.token)}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t("payNow")}
          </a>
        </div>
      )}

      {!orderConfirmed && (
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
              disabled={distanceLoading}
              className="rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-70"
            >
              {distanceLoading ? "…" : t("next")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={loading || !confirmChecked}
              className="rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "…" : t("confirmOrder")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
