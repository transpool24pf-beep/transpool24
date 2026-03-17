"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { calculatePriceCents, formatPrice, type ServiceType } from "@/lib/pricing";
import { volumeM3, suggestCargoSize, suggestVehicleLabel, type CargoType } from "@/lib/cargo";

const RouteMap = dynamic(
  () => import("@/components/RouteMapInner").then((m) => m.RouteMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-[#0d2137]/20 bg-[#0d2137]/5 text-sm text-[var(--foreground)]">
        Loading map…
      </div>
    ),
  }
);

type Suggestion = { display_name: string; lat: number; lon: number };
type RouteGeo = {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  geometry: GeoJSON.LineString | null;
};

const CARGO_OPTIONS = ["XS", "M", "L"] as const;
type CargoSize = (typeof CARGO_OPTIONS)[number];

const SERVICE_OPTIONS: { value: ServiceType; key: "serviceDriverOnly" | "serviceDriverCar" | "serviceDriverCarAssistant" }[] = [
  { value: "driver_only", key: "serviceDriverOnly" },
  { value: "driver_car", key: "serviceDriverCar" },
  { value: "driver_car_assistant", key: "serviceDriverCarAssistant" },
];

const DEFAULT_KM = 50;

const CARGO_TYPE_OPTIONS: { value: CargoType; key: string }[] = [
  { value: "euro_pallet", key: "cargoTypeEuroPallet" },
  { value: "pallets_boxes", key: "cargoTypePalletsBoxes" },
  { value: "parcels", key: "cargoTypeParcels" },
];

export type OrderFormData = {
  companyName: string;
  email: string;
  phone: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupDate: string;
  pickupTime: string;
  cargoSize: CargoSize;
  serviceType: ServiceType | "";
  distanceKm: number;
  cargoLengthCm: number;
  cargoWidthCm: number;
  cargoHeightCm: number;
  cargoWeightKg: number;
  cargoType: CargoType | "";
  stackable: boolean;
};

const initial: OrderFormData = {
  companyName: "",
  email: "",
  phone: "",
  pickupAddress: "Pforzheim",
  deliveryAddress: "",
  pickupDate: "",
  pickupTime: "",
  cargoSize: "M",
  serviceType: "",
  distanceKm: DEFAULT_KM,
  cargoLengthCm: 0,
  cargoWidthCm: 0,
  cargoHeightCm: 0,
  cargoWeightKg: 0,
  cargoType: "",
  stackable: false,
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
  const [distanceFromRoute, setDistanceFromRoute] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [routeGeo, setRouteGeo] = useState<RouteGeo | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const estimatedDurationMinutes =
    data.serviceType === "driver_only" ? (data.distanceKm / 50) * 60 : null;
  const priceCents = calculatePriceCents(
    data.distanceKm,
    data.cargoSize,
    estimatedDurationMinutes,
    null,
    data.serviceType || "driver_car"
  );

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
    setDistanceError(null);
    try {
      const res = await fetch(
        `/api/route-distance?pickup=${encodeURIComponent(data.pickupAddress)}&delivery=${encodeURIComponent(data.deliveryAddress)}&_=${Date.now()}`
      );
      const json = await res.json();
      if (res.ok && typeof json.distanceKm === "number" && json.distanceKm > 0) {
        update({ distanceKm: Math.round(json.distanceKm * 10) / 10 });
        setDistanceFromRoute(true);
        if (json.from && json.to) {
          setRouteGeo({
            from: json.from,
            to: json.to,
            geometry: json.geometry ?? null,
          });
        } else {
          setRouteGeo(null);
        }
      } else {
        setDistanceFromRoute(false);
        setRouteGeo(null);
        setDistanceError(json.error || "Could not calculate route");
      }
    } catch {
      setDistanceFromRoute(false);
      setRouteGeo(null);
      setDistanceError("Network error");
    } finally {
      setDistanceLoading(false);
    }
  }, [data.pickupAddress, data.deliveryAddress]);

  // If we have distance but no map data (e.g. old API response), refetch once to get from/to for the map
  useEffect(() => {
    if (
      step !== 2 ||
      !data.pickupAddress.trim() ||
      !data.deliveryAddress.trim() ||
      !distanceFromRoute ||
      routeGeo != null
    ) {
      return;
    }
    let cancelled = false;
    fetch(
      `/api/route-distance?pickup=${encodeURIComponent(data.pickupAddress)}&delivery=${encodeURIComponent(data.deliveryAddress)}&_=${Date.now()}`
    )
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || !json.from || !json.to) return;
        setRouteGeo({
          from: json.from,
          to: json.to,
          geometry: json.geometry ?? null,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [step, data.pickupAddress, data.deliveryAddress, distanceFromRoute, routeGeo]);

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
          pickupTime: data.pickupDate && data.pickupTime ? `${data.pickupDate}T${data.pickupTime}` : null,
          cargoSize: data.cargoSize,
          serviceType: data.serviceType || "driver_car",
          distanceKm: data.distanceKm,
          priceCents,
          cargoDetails:
            data.cargoLengthCm > 0 ||
            data.cargoWidthCm > 0 ||
            data.cargoHeightCm > 0 ||
            data.cargoWeightKg > 0 ||
            data.cargoType ||
            data.stackable
              ? {
                  lengthCm: data.cargoLengthCm || null,
                  widthCm: data.cargoWidthCm || null,
                  heightCm: data.cargoHeightCm || null,
                  weightKg: data.cargoWeightKg || null,
                  cargoType: data.cargoType || null,
                  stackable: data.stackable,
                }
              : null,
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                {t("pickupDate")}
              </label>
              <input
                type="date"
                value={data.pickupDate}
                onChange={(e) => update({ pickupDate: e.target.value })}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                {t("pickupTime")}
              </label>
              <input
                type="time"
                value={data.pickupTime}
                onChange={(e) => update({ pickupTime: e.target.value })}
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
          {data.pickupAddress.trim() && data.deliveryAddress.trim() && (
            <>
              <div className="rounded-lg border border-[#0d2137]/15 bg-[#0d2137]/5 p-4">
                <button
                  type="button"
                  onClick={fetchRealDistance}
                  disabled={distanceLoading}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-70"
                >
                  {distanceLoading ? "…" : t("calculateDistance")}
                </button>
                {distanceFromRoute && (
                  <p className="mt-2 text-sm font-medium text-green-700">
                    {t("distanceRouteResult")}: {data.distanceKm} km
                  </p>
                )}
                {distanceError && !distanceLoading && (
                  <p className="mt-2 text-sm text-amber-700">{t("distanceManualHint")}</p>
                )}
              </div>
              {routeGeo && (
                <div className="min-h-[300px] rounded-lg border border-[#0d2137]/15 bg-[#0d2137]/5 p-2">
                  <RouteMap
                    key={`${routeGeo.from.lat}-${routeGeo.from.lon}-${routeGeo.to.lat}-${routeGeo.to.lon}`}
                    from={routeGeo.from}
                    to={routeGeo.to}
                    geometry={routeGeo.geometry}
                    distanceKm={data.distanceKm}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--primary)]">
            {t("step3")}
          </h2>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              {t("serviceType")}
            </label>
            <div className="space-y-2">
              {SERVICE_OPTIONS.map(({ value, key }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ serviceType: value })}
                  className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition ${
                    data.serviceType === value
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[#0d2137]/20 text-[var(--foreground)] hover:border-[#0d2137]/40"
                  }`}
                >
                  <span
                    className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                      data.serviceType === value
                        ? "border-[var(--accent)] bg-[var(--accent)]"
                        : "border-[#0d2137]/40"
                    }`}
                  />
                  <span className="font-medium">{t(key)}</span>
                </button>
              ))}
            </div>
            {!data.serviceType && (
              <p className="mt-1 text-sm text-amber-700">{t("serviceTypeRequired")}</p>
            )}
          </div>
          <div className="rounded-lg border border-[#0d2137]/15 bg-[#0d2137]/5 p-4">
            <p className="mb-3 text-sm font-medium text-[var(--foreground)]">
              {t("cargoDetails")}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-[var(--foreground)]/80">{t("cargoLengthCm")}</label>
                <input
                  type="number"
                  min={0}
                  value={data.cargoLengthCm || ""}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    const vol = volumeM3(v, data.cargoWidthCm, data.cargoHeightCm);
                    const size = suggestCargoSize(vol, data.cargoWeightKg);
                    update({ cargoLengthCm: v, cargoSize: size });
                  }}
                  placeholder="120"
                  className="w-full rounded border border-[#0d2137]/20 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--foreground)]/80">{t("cargoWidthCm")}</label>
                <input
                  type="number"
                  min={0}
                  value={data.cargoWidthCm || ""}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    const vol = volumeM3(data.cargoLengthCm, v, data.cargoHeightCm);
                    const size = suggestCargoSize(vol, data.cargoWeightKg);
                    update({ cargoWidthCm: v, cargoSize: size });
                  }}
                  placeholder="80"
                  className="w-full rounded border border-[#0d2137]/20 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--foreground)]/80">{t("cargoHeightCm")}</label>
                <input
                  type="number"
                  min={0}
                  value={data.cargoHeightCm || ""}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    const vol = volumeM3(data.cargoLengthCm, data.cargoWidthCm, v);
                    const size = suggestCargoSize(vol, data.cargoWeightKg);
                    update({ cargoHeightCm: v, cargoSize: size });
                  }}
                  placeholder="100"
                  className="w-full rounded border border-[#0d2137]/20 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--foreground)]/80">{t("cargoWeightKg")}</label>
                <input
                  type="number"
                  min={0}
                  value={data.cargoWeightKg || ""}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    const vol = volumeM3(data.cargoLengthCm, data.cargoWidthCm, data.cargoHeightCm);
                    const size = suggestCargoSize(vol, v);
                    update({ cargoWeightKg: v, cargoSize: size });
                  }}
                  placeholder="250"
                  className="w-full rounded border border-[#0d2137]/20 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div>
                <label className="mb-1 block text-xs text-[var(--foreground)]/80">{t("cargoType")}</label>
                <select
                  value={data.cargoType || ""}
                  onChange={(e) => update({ cargoType: (e.target.value || "") as CargoType | "" })}
                  className="rounded border border-[#0d2137]/20 px-2 py-1.5 text-sm"
                >
                  <option value="">—</option>
                  {CARGO_TYPE_OPTIONS.map(({ value, key }) => (
                    <option key={value} value={value}>{t(key)}</option>
                  ))}
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  checked={data.stackable}
                  onChange={(e) => update({ stackable: e.target.checked })}
                  className="rounded border-[#0d2137]/30 text-[var(--accent)]"
                />
                <span className="text-sm text-[var(--foreground)]/90">{t("stackable")}</span>
              </label>
            </div>
            {(data.cargoLengthCm > 0 || data.cargoWidthCm > 0 || data.cargoHeightCm > 0 || data.cargoWeightKg > 0) && (
              <p className="mt-3 text-sm text-green-700">
                {t("suggestedSize")}: {t(`cargo${data.cargoSize}` as "cargoXS")} — {t("suggestedVehicle")}: {suggestVehicleLabel(data.cargoSize)}
              </p>
            )}
          </div>
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
              {distanceFromRoute ? t("distanceRoute") : t("distance")} (km)
            </label>
            {distanceFromRoute ? (
              <div className="rounded-lg border border-green-200 bg-green-50/50 px-4 py-3 text-sm font-medium text-green-800">
                {data.distanceKm} km — {t("distanceFromRouteLabel")}
              </div>
            ) : (
              <input
                type="number"
                min={1}
                max={500}
                value={data.distanceKm}
                onChange={(e) => {
                  update({ distanceKm: Math.max(1, Number(e.target.value) || 1) });
                  setDistanceFromRoute(false);
                }}
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                step={0.1}
              />
            )}
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
            {(data.pickupDate || data.pickupTime) && (
              <p><strong>{t("pickupDate")} / {t("pickupTime")}:</strong> {data.pickupDate ? new Date(data.pickupDate).toLocaleDateString() : "—"} {data.pickupTime ? data.pickupTime : ""}</p>
            )}
            <p><strong>{t("serviceType")}:</strong> {data.serviceType ? t(SERVICE_OPTIONS.find((o) => o.value === data.serviceType)?.key ?? "serviceDriverCar") : "—"}</p>
            <p><strong>{t("cargoSize")}:</strong> {t(`cargo${data.cargoSize}` as "cargoXS")}</p>
            {(data.cargoLengthCm > 0 || data.cargoWidthCm > 0 || data.cargoHeightCm > 0 || data.cargoWeightKg > 0 || data.cargoType) && (
              <p><strong>{t("cargoDetails")}:</strong> {[data.cargoLengthCm && `${data.cargoLengthCm}×${data.cargoWidthCm}×${data.cargoHeightCm} cm`, data.cargoWeightKg && `${data.cargoWeightKg} kg`, data.cargoType && t(CARGO_TYPE_OPTIONS.find((o) => o.value === data.cargoType)?.key ?? "cargoTypeEuroPallet"), data.stackable && t("stackable")].filter(Boolean).join(" · ")}</p>
            )}
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
              disabled={distanceLoading || (step === 3 && !data.serviceType)}
              className="rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
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
