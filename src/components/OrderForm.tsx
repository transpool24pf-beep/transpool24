"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { calculatePriceCents, formatPrice, type ServiceType } from "@/lib/pricing";
import { volumeM3, suggestCargoSize, suggestVehicleLabel, getLoadUnloadMinutes, CARGO_CATEGORIES, type CargoType, type CargoCategoryId } from "@/lib/cargo";

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

/** Country codes for WhatsApp: Germany first, then others. */
const COUNTRY_CODES: { code: string; flag: string }[] = [
  { code: "+49", flag: "🇩🇪" },
  { code: "+43", flag: "🇦🇹" },
  { code: "+41", flag: "🇨🇭" },
  { code: "+31", flag: "🇳🇱" },
  { code: "+32", flag: "🇧🇪" },
  { code: "+33", flag: "🇫🇷" },
  { code: "+34", flag: "🇪🇸" },
  { code: "+39", flag: "🇮🇹" },
  { code: "+44", flag: "🇬🇧" },
  { code: "+45", flag: "🇩🇰" },
  { code: "+46", flag: "🇸🇪" },
  { code: "+47", flag: "🇳🇴" },
  { code: "+48", flag: "🇵🇱" },
  { code: "+351", flag: "🇵🇹" },
  { code: "+352", flag: "🇱🇺" },
  { code: "+353", flag: "🇮🇪" },
  { code: "+358", flag: "🇫🇮" },
  { code: "+30", flag: "🇬🇷" },
  { code: "+36", flag: "🇭🇺" },
  { code: "+359", flag: "🇧🇬" },
  { code: "+385", flag: "🇭🇷" },
  { code: "+386", flag: "🇸🇮" },
  { code: "+420", flag: "🇨🇿" },
  { code: "+421", flag: "🇸🇰" },
  { code: "+370", flag: "🇱🇹" },
  { code: "+371", flag: "🇱🇻" },
  { code: "+372", flag: "🇪🇪" },
  { code: "+1", flag: "🇺🇸" },
  { code: "+52", flag: "🇲🇽" },
  { code: "+55", flag: "🇧🇷" },
  { code: "+54", flag: "🇦🇷" },
  { code: "+61", flag: "🇦🇺" },
  { code: "+81", flag: "🇯🇵" },
  { code: "+86", flag: "🇨🇳" },
  { code: "+91", flag: "🇮🇳" },
  { code: "+90", flag: "🇹🇷" },
  { code: "+7", flag: "🇷🇺" },
  { code: "+82", flag: "🇰🇷" },
  { code: "+27", flag: "🇿🇦" },
  { code: "+20", flag: "🇪🇬" },
  { code: "+212", flag: "🇲🇦" },
  { code: "+213", flag: "🇩🇿" },
  { code: "+216", flag: "🇹🇳" },
  { code: "+962", flag: "🇯🇴" },
  { code: "+961", flag: "🇱🇧" },
  { code: "+972", flag: "🇮🇱" },
  { code: "+966", flag: "🇸🇦" },
  { code: "+971", flag: "🇦🇪" },
  { code: "+974", flag: "🇶🇦" },
  { code: "+973", flag: "🇧🇭" },
  { code: "+964", flag: "🇮🇶" },
  { code: "+98", flag: "🇮🇷" },
  { code: "+963", flag: "🇸🇾" },
  { code: "+249", flag: "🇸🇩" },
  { code: "+218", flag: "🇱🇾" },
  { code: "+260", flag: "🇿🇲" },
  { code: "+254", flag: "🇰🇪" },
  { code: "+234", flag: "🇳🇬" },
  { code: "+233", flag: "🇬🇭" },
  { code: "+255", flag: "🇹🇿" },
  { code: "+256", flag: "🇺🇬" },
  { code: "+250", flag: "🇷🇼" },
  { code: "+237", flag: "🇨🇲" },
];

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
  cargoCategory: CargoCategoryId | "";
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
  cargoCategory: "",
  serviceType: "",
  distanceKm: DEFAULT_KM,
  cargoLengthCm: 0,
  cargoWidthCm: 0,
  cargoHeightCm: 0,
  cargoWeightKg: 0,
  cargoType: "",
  stackable: false,
};

export function OrderForm({ locale, onOrderConfirmed }: { locale: string; onOrderConfirmed?: () => void }) {
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
  const [routeDurationMinutes, setRouteDurationMinutes] = useState<number | null>(null);
  const [phoneCountryCode, setPhoneCountryCode] = useState("+49");
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);
  const countryCodeRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (countryCodeRef.current && !countryCodeRef.current.contains(e.target as Node)) {
        setCountryCodeOpen(false);
      }
    };
    if (countryCodeOpen) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [countryCodeOpen]);

  const normalizePhone = (value: string, countryCode: string = phoneCountryCode) => {
    const digits = value.replace(/\D/g, "");
    if (!digits.length) return value.trim();
    const prefix = countryCode.replace(/\D/g, "");
    if (digits.startsWith(prefix) && digits.length > prefix.length) return `+${digits}`;
    if (digits.startsWith("0")) return `${countryCode}${digits.slice(1)}`;
    return `${countryCode}${digits}`;
  };

  const step1Complete = data.companyName.trim() !== "" && data.email.trim() !== "" && data.phone.trim() !== "";
  const step2Complete = data.pickupAddress.trim() !== "" && data.deliveryAddress.trim() !== "";
  const step3Complete = data.serviceType !== "" && distanceFromRoute;

  const oneWayMinutes = routeDurationMinutes ?? (data.distanceKm / 50) * 60;
  const roundTripMinutes = oneWayMinutes * 2;
  const { loadingMinutes, unloadingMinutes } = getLoadUnloadMinutes(
    data.cargoCategory || null,
    data.cargoWeightKg || 0
  );
  const totalDriverMinutes = roundTripMinutes + loadingMinutes + unloadingMinutes;
  const estimatedDurationMinutes = routeDurationMinutes ?? (data.distanceKm / 50) * 60;
  const priceCents = calculatePriceCents(
    data.distanceKm,
    data.cargoSize,
    estimatedDurationMinutes,
    null,
    data.serviceType || "driver_car",
    totalDriverMinutes
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
    const departureParam =
      data.pickupDate && data.pickupTime
        ? `&departure_time=${encodeURIComponent(`${data.pickupDate}T${data.pickupTime}`)}`
        : "";
    try {
      const res = await fetch(
        `/api/route-distance?pickup=${encodeURIComponent(data.pickupAddress)}&delivery=${encodeURIComponent(data.deliveryAddress)}${departureParam}&_=${Date.now()}`
      );
      const json = await res.json();
      if (res.ok && typeof json.distanceKm === "number" && json.distanceKm > 0) {
        update({ distanceKm: Math.round(json.distanceKm * 10) / 10 });
        setDistanceFromRoute(true);
        setRouteDurationMinutes(typeof json.durationMinutes === "number" ? json.durationMinutes : null);
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
        setRouteDurationMinutes(null);
        setDistanceError(json.error || "Could not calculate route");
      }
    } catch {
      setDistanceFromRoute(false);
      setRouteGeo(null);
      setRouteDurationMinutes(null);
      setDistanceError("Network error");
    } finally {
      setDistanceLoading(false);
    }
  }, [data.pickupAddress, data.deliveryAddress, data.pickupDate, data.pickupTime]);

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
          phone: normalizePhone(data.phone),
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
            data.stackable ||
            data.cargoCategory
              ? {
                  lengthCm: data.cargoLengthCm || null,
                  widthCm: data.cargoWidthCm || null,
                  heightCm: data.cargoHeightCm || null,
                  weightKg: data.cargoWeightKg || null,
                  cargoType: data.cargoType || null,
                  stackable: data.stackable,
                  cargoCategory: data.cargoCategory || null,
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
        onOrderConfirmed?.();
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
      {!orderConfirmed && (
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
      )}

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
              {t("whatsapp")}
            </label>
            <div className="flex gap-2" ref={countryCodeRef}>
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setCountryCodeOpen((o) => !o)}
                  className="flex min-w-[4.5rem] items-center gap-1.5 rounded-lg border border-[#0d2137]/20 bg-[#0d2137]/5 px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[#0d2137]/10 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  aria-expanded={countryCodeOpen}
                  aria-haspopup="listbox"
                  aria-label={t("selectCountryCode")}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {COUNTRY_CODES.find((c) => c.code === phoneCountryCode)?.flag ?? "🇩🇪"}
                  </span>
                  <span>{phoneCountryCode}</span>
                  <span className="ml-0.5 shrink-0 text-[var(--foreground)]/60" aria-hidden>▾</span>
                </button>
                {countryCodeOpen && (
                  <ul
                    className="absolute left-0 top-full z-20 mt-1 max-h-64 w-48 overflow-auto rounded-lg border border-[#0d2137]/20 bg-white py-1 shadow-lg"
                    role="listbox"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <li key={c.code + c.flag}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={c.code === phoneCountryCode}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#0d2137]/10 ${
                            c.code === phoneCountryCode ? "bg-[var(--accent)]/10 text-[var(--accent)]" : ""
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setPhoneCountryCode(c.code);
                            setCountryCodeOpen(false);
                          }}
                        >
                          <span className="text-lg leading-none">{c.flag}</span>
                          <span>{c.code}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => update({ phone: e.target.value })}
                placeholder={t("whatsappPlaceholder")}
                className="min-w-0 flex-1 rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
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
              {t("cargoWhatToTransport")}
            </label>
            <select
              value={data.cargoCategory || ""}
              onChange={(e) => {
                const id = (e.target.value || "") as CargoCategoryId | "";
                const cat = id ? CARGO_CATEGORIES.find((c) => c.id === id) : null;
                update({
                  cargoCategory: id,
                  ...(cat ? { cargoSize: cat.suggestedSize } : {}),
                });
              }}
              className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2.5 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value="">— {t("cargoSelectCategory")}</option>
              {CARGO_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(c.labelKey)}
                </option>
              ))}
            </select>
          </div>
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
          <div className="rounded-lg border border-[#0d2137]/15 bg-[#0d2137]/5 p-4">
            <p className="mb-2 text-sm font-medium text-[var(--foreground)]">{t("driverTimeSummary")}</p>
            {!distanceFromRoute ? (
              <p className="text-sm text-amber-700">
                {t("driverTimeRequiresAddress")}
              </p>
            ) : (
              <>
                <p className="text-sm text-[var(--foreground)]/90">
                  {t("roundTripTime")}: {Math.floor(roundTripMinutes / 60)} {t("hours")} {roundTripMinutes % 60} {t("minutes")}
                  {routeDurationMinutes != null && (
                    <span className="ml-1 text-green-700">({t("fromRoute")})</span>
                  )}
                </p>
                <p className="text-sm text-[var(--foreground)]/90">
                  {t("loadingUnloadingTime")}: {loadingMinutes} + {unloadingMinutes} {t("minutes")}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--accent)]">
                  {t("totalDriverTime")}: {(totalDriverMinutes / 60).toFixed(1)} {t("hours")}
                </p>
              </>
            )}
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
            <p><strong>{t("whatsapp")}:</strong> {data.phone.trim() ? normalizePhone(data.phone) : data.phone}</p>
            <p><strong>{t("pickup")}:</strong> {data.pickupAddress}</p>
            <p><strong>{t("delivery")}:</strong> {data.deliveryAddress}</p>
            {(data.pickupDate || data.pickupTime) && (
              <p><strong>{t("pickupDate")} / {t("pickupTime")}:</strong> {data.pickupDate ? new Date(data.pickupDate).toLocaleDateString() : "—"} {data.pickupTime ? data.pickupTime : ""}</p>
            )}
            <p><strong>{t("serviceType")}:</strong> {data.serviceType ? t(SERVICE_OPTIONS.find((o) => o.value === data.serviceType)?.key ?? "serviceDriverCar") : "—"}</p>
            {data.cargoCategory && (
              <p><strong>{t("cargoWhatToTransport")}:</strong> {t(CARGO_CATEGORIES.find((c) => c.id === data.cargoCategory)?.labelKey ?? "cargoCatMisc")}</p>
            )}
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
        <div className="space-y-5 rounded-xl border border-green-200 bg-green-50 p-6 text-[var(--primary)]">
          <div className="text-center">
            <p className="text-xl font-semibold text-green-800">{t("thankYouTitle")}</p>
            <p className="mt-2 text-green-700">{t("thankYouMessage")}</p>
            <p className="mt-3 text-sm text-green-700">{t("confirmByEmailHint")}</p>
          </div>
          <p className="text-center text-sm text-green-700">
            {t("orderRef")}: <code className="rounded bg-green-100 px-1.5 py-0.5 font-mono text-xs">{orderConfirmed.jobId}</code>
          </p>
          <div className="border-t border-green-200 pt-4 text-center">
            <p className="mb-1 text-sm font-medium text-green-800">{t("rateUsOnGoogle")}</p>
            <div className="flex justify-center gap-0.5 text-2xl text-amber-400" aria-hidden>
              ★★★★★
            </div>
          </div>
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
              disabled={
                distanceLoading ||
                (step === 1 && !step1Complete) ||
                (step === 2 && !step2Complete) ||
                (step === 3 && !step3Complete)
              }
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
