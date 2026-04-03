"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useId } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { OrderRouteLottie } from "@/components/OrderRouteLottie";
import {
  formatPrice,
  splitHoursMinutesParts,
  type ServiceType,
  type PricingOptions,
  type PriceBreakdown,
} from "@/lib/pricing";
import { getLoadUnloadMinutes, CARGO_CATEGORIES, type CargoCategoryId } from "@/lib/cargo";
import {
  loadOrderAddressHistory,
  mergePersistedAddresses,
  filterAddressHistoryForQuery,
} from "@/lib/order-address-history";
import { localeToHtmlLang } from "@/lib/locale-html-lang";
import {
  formatIsoDateForOrderInput,
  localTodayIso,
  maskPickupDateInput,
  parseOrderDateInputToIso,
} from "@/lib/order-pickup-date-input";
import {
  clearOrderFormDraft,
  loadOrderFormDraft,
  saveOrderFormDraft,
} from "@/lib/order-form-draft";
import {
  filterContactHistoryForQuery,
  loadOrderContactHistory,
  mergePersistedContact,
  type OrderContactEntry,
} from "@/lib/order-contact-history";

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

type Suggestion = {
  display_name: string;
  lat?: number;
  lon?: number;
  place_id?: string;
};

type PlaceDetailsJson = {
  formatted_address?: string;
  street?: string | null;
  houseNumber?: string | null;
  postcode?: string | null;
};
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

/** Append country for geocoding when the customer omits it */
function addressLineForGeocode(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/deutschland|germany/gi.test(t)) return t;
  return `${t}, Deutschland`;
}

function lineFromPlaceDetails(j: PlaceDetailsJson, displayFallback: string): string {
  const street = j.street?.trim() || "";
  const hn = j.houseNumber?.trim() || "";
  const pc = j.postcode?.trim().replace(/\D/g, "").slice(0, 5) || "";
  if (street && hn && /^\d{5}$/.test(pc)) {
    return `${street} ${hn}, ${pc}, Deutschland`;
  }
  const fa = j.formatted_address?.trim();
  if (fa) return fa;
  return displayFallback;
}

/** Street + number + German PLZ in one line (minimum bar before continuing) */
function addressCompleteEnoughForOrder(value: string): boolean {
  const t = value.trim();
  if (t.length < 10) return false;
  return /\b\d{5}\b/.test(t);
}

type OrderPricePreview = {
  breakdown: PriceBreakdown;
  roundTripMinutes: number;
  totalDriverMinutes: number;
  routeTerrain: string;
  routeWeather: string;
  routeDriveTimeMultiplier: number;
  terrainSource: string;
  weatherSource: string;
};

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

export type OrderFormData = {
  companyName: string;
  email: string;
  phone: string;
  /** Full pickup line: street, house no., postcode (and city) — one field */
  pickupAddressLine: string;
  deliveryAddressLine: string;
  pickupDate: string;
  pickupTime: string;
  cargoSize: CargoSize;
  cargoCategory: CargoCategoryId | "";
  serviceType: ServiceType | "";
  distanceKm: number;
  cargoWeightKg: number;
  packageCount: number;
};

const initial: OrderFormData = {
  companyName: "",
  email: "",
  phone: "",
  pickupAddressLine: "",
  deliveryAddressLine: "",
  pickupDate: "",
  pickupTime: "",
  cargoSize: "M",
  cargoCategory: "",
  serviceType: "",
  distanceKm: DEFAULT_KM,
  cargoWeightKg: 0,
  packageCount: 0,
};

export function OrderForm({
  locale,
  onOrderConfirmed,
  bookingsPaused = false,
}: {
  locale: string;
  onOrderConfirmed?: () => void;
  bookingsPaused?: boolean;
}) {
  const t = useTranslations("order");
  const htmlLang = useMemo(() => localeToHtmlLang(locale), [locale]);
  const isRtlLocale = locale === "ar" || locale === "ku";
  const cargoPhotoInputId = useId();
  const cargoPhotoInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OrderFormData>(initial);
  const [pickupDateField, setPickupDateField] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<{ jobId: string; token: string; whatsappLink: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [deliverySuggestions, setDeliverySuggestions] = useState<Suggestion[]>([]);
  const [addressHistory, setAddressHistory] = useState<string[]>([]);
  const [contactHistory, setContactHistory] = useState<OrderContactEntry[]>([]);
  const [contactSuggestionsOpen, setContactSuggestionsOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState<"pickup" | "delivery" | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceFromRoute, setDistanceFromRoute] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  /** Server hint (e.g. Google API key / Directions setup) shown under the generic manual-distance message */
  const [distanceHint, setDistanceHint] = useState<string | null>(null);
  const [routeGeo, setRouteGeo] = useState<RouteGeo | null>(null);
  const [routeDurationMinutes, setRouteDurationMinutes] = useState<number | null>(null);
  const [pricingOpts, setPricingOpts] = useState<PricingOptions | null>(null);
  const [cargoPhotoUrls, setCargoPhotoUrls] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [pricePreview, setPricePreview] = useState<OrderPricePreview | null>(null);
  const [pricePreviewLoading, setPricePreviewLoading] = useState(false);
  const [pricePreviewError, setPricePreviewError] = useState<string | null>(null);
  const [phoneCountryCode, setPhoneCountryCode] = useState("+49");
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const countryCodeRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Links Google Autocomplete + Place Details billing sessions */
  const placesSessionRef = useRef(
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `tp24-${Date.now()}`
  );
  const pickupAddress = useMemo(() => addressLineForGeocode(data.pickupAddressLine), [data.pickupAddressLine]);
  const deliveryAddress = useMemo(() => addressLineForGeocode(data.deliveryAddressLine), [data.deliveryAddressLine]);
  const addressLineInputNamesRef = useRef({
    pickup:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `tp24-addr-pu-${crypto.randomUUID().slice(0, 10)}`
        : `tp24-addr-pu-${Date.now()}`,
    delivery:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `tp24-addr-de-${crypto.randomUUID().slice(0, 10)}`
        : `tp24-addr-de-${Date.now()}`,
  });

  useEffect(() => {
    setAddressHistory(loadOrderAddressHistory());
  }, []);

  useEffect(() => {
    setContactHistory(loadOrderContactHistory());
  }, []);

  useEffect(() => {
    const d = loadOrderFormDraft();
    if (d) {
      setStep(Math.min(4, Math.max(1, d.step)));
      setData(d.data);
      setPickupDateField(maskPickupDateInput(d.pickupDateField));
      setCargoPhotoUrls(Array.isArray(d.cargoPhotoUrls) ? d.cargoPhotoUrls : []);
      setPhoneCountryCode(d.phoneCountryCode || "+49");
      setDistanceFromRoute(Boolean(d.distanceFromRoute));
      setDistanceError(d.distanceError);
      setDistanceHint(d.distanceHint);
      setRouteDurationMinutes(d.routeDurationMinutes);
      setRouteGeo(
        d.routeGeo
          ? {
              from: d.routeGeo.from,
              to: d.routeGeo.to,
              geometry: d.routeGeo.geometry as GeoJSON.LineString | null,
            }
          : null
      );
      setConfirmChecked(Boolean(d.confirmChecked));
    }
    setDraftRestored(true);
  }, []);

  /** Keep partial typing in the field; only derive display from ISO when we have a committed date (or locale changes). */
  useEffect(() => {
    if (!draftRestored) return;
    setPickupDateField((display) => {
      if (!data.pickupDate) return display;
      return formatIsoDateForOrderInput(data.pickupDate, locale);
    });
  }, [draftRestored, locale, data.pickupDate]);

  useEffect(() => {
    if (!draftRestored || orderConfirmed) return;
    const tid = setTimeout(() => {
      saveOrderFormDraft({
        v: 1,
        step,
        data,
        pickupDateField,
        cargoPhotoUrls,
        phoneCountryCode,
        distanceFromRoute,
        distanceError,
        distanceHint,
        routeDurationMinutes,
        routeGeo: routeGeo
          ? {
              from: routeGeo.from,
              to: routeGeo.to,
              geometry: routeGeo.geometry
                ? {
                    type: "LineString" as const,
                    coordinates: routeGeo.geometry.coordinates as [number, number][],
                  }
                : null,
            }
          : null,
        confirmChecked,
      });
    }, 400);
    return () => clearTimeout(tid);
  }, [
    draftRestored,
    orderConfirmed,
    step,
    data,
    pickupDateField,
    cargoPhotoUrls,
    phoneCountryCode,
    distanceFromRoute,
    distanceError,
    distanceHint,
    routeDurationMinutes,
    routeGeo,
    confirmChecked,
  ]);

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

  const pickupHistoryMatches = useMemo(
    () => filterAddressHistoryForQuery(addressHistory, data.pickupAddressLine, 10),
    [addressHistory, data.pickupAddressLine]
  );
  const deliveryHistoryMatches = useMemo(
    () => filterAddressHistoryForQuery(addressHistory, data.deliveryAddressLine, 10),
    [addressHistory, data.deliveryAddressLine]
  );

  const pickupHistoryKeySet = useMemo(
    () => new Set(pickupHistoryMatches.map((l) => l.trim().toLowerCase().replace(/\s+/g, " "))),
    [pickupHistoryMatches]
  );
  const deliveryHistoryKeySet = useMemo(
    () => new Set(deliveryHistoryMatches.map((l) => l.trim().toLowerCase().replace(/\s+/g, " "))),
    [deliveryHistoryMatches]
  );

  const pickupApiSuggestionsDeduped = useMemo(
    () =>
      pickupSuggestions.filter((s) => {
        const k = s.display_name.trim().toLowerCase().replace(/\s+/g, " ");
        return k.length > 0 && !pickupHistoryKeySet.has(k);
      }),
    [pickupSuggestions, pickupHistoryKeySet]
  );
  const contactFiltered = useMemo(
    () => filterContactHistoryForQuery(contactHistory, data.companyName, data.email, data.phone),
    [contactHistory, data.companyName, data.email, data.phone]
  );

  const applyContactSuggestion = useCallback((c: OrderContactEntry) => {
    setPhoneCountryCode(c.phoneCountryCode || "+49");
    setData((prev) => ({
      ...prev,
      companyName: c.companyName,
      email: c.email,
      phone: c.phone,
    }));
    setError(null);
    setContactSuggestionsOpen(false);
  }, []);

  const deliveryApiSuggestionsDeduped = useMemo(
    () =>
      deliverySuggestions.filter((s) => {
        const k = s.display_name.trim().toLowerCase().replace(/\s+/g, " ");
        return k.length > 0 && !deliveryHistoryKeySet.has(k);
      }),
    [deliverySuggestions, deliveryHistoryKeySet]
  );

  const applyAddressLineSuggestion = useCallback((field: "pickup" | "delivery", s: Suggestion) => {
    void (async () => {
      const rotateSession = () => {
        placesSessionRef.current =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `tp24-${Date.now()}`;
      };
      const key = field === "pickup" ? "pickupAddressLine" : "deliveryAddressLine";
      try {
        if (s.place_id) {
          const res = await fetch(
            `/api/place-details?place_id=${encodeURIComponent(s.place_id)}&session=${encodeURIComponent(placesSessionRef.current)}`
          );
          const j = (await res.json()) as PlaceDetailsJson;
          rotateSession();
          setData((prev) => ({
            ...prev,
            [key]: lineFromPlaceDetails(j, s.display_name || (field === "pickup" ? prev.pickupAddressLine : prev.deliveryAddressLine)),
          }));
          setError(null);
        } else {
          setData((prev) => ({
            ...prev,
            [key]: s.display_name || (field === "pickup" ? prev.pickupAddressLine : prev.deliveryAddressLine),
          }));
          setError(null);
        }
      } catch {
        setData((prev) => ({
          ...prev,
          [key]: s.display_name || (field === "pickup" ? prev.pickupAddressLine : prev.deliveryAddressLine),
        }));
        setError(null);
      }
      if (field === "pickup") setPickupSuggestions([]);
      else setDeliverySuggestions([]);
      setSuggestionsOpen(null);
    })();
  }, []);

  const normalizePhone = (value: string, countryCode: string = phoneCountryCode) => {
    const digits = value.replace(/\D/g, "");
    if (!digits.length) return value.trim();
    const prefix = countryCode.replace(/\D/g, "");
    if (digits.startsWith(prefix) && digits.length > prefix.length) return `+${digits}`;
    if (digits.startsWith("0")) return `${countryCode}${digits.slice(1)}`;
    return `${countryCode}${digits}`;
  };

  const step1Complete = data.companyName.trim() !== "" && data.email.trim() !== "" && data.phone.trim() !== "";
  const step2Complete =
    addressCompleteEnoughForOrder(data.pickupAddressLine) && addressCompleteEnoughForOrder(data.deliveryAddressLine);
  const step3Complete =
    data.serviceType !== "" &&
    distanceFromRoute &&
    data.cargoCategory !== "" &&
    data.cargoWeightKg > 0 &&
    data.packageCount >= 1 &&
    cargoPhotoUrls.length >= 1;

  const showStep3Price = step3Complete && !!pricePreview && !pricePreviewLoading && !pricePreviewError;

  const oneWayBaseMinutes = Math.round(routeDurationMinutes ?? (data.distanceKm / 50) * 60);
  const baseRoundTripMinutes = oneWayBaseMinutes * 2;
  const { loadingMinutes, unloadingMinutes } = getLoadUnloadMinutes();
  const roundTripMinutesDisplay = pricePreview?.roundTripMinutes ?? baseRoundTripMinutes;
  const totalDriverMinutesDisplay =
    pricePreview?.totalDriverMinutes ??
    Math.round(baseRoundTripMinutes + loadingMinutes + unloadingMinutes);
  const roundTripParts = splitHoursMinutesParts(roundTripMinutesDisplay);
  const totalTimeParts = splitHoursMinutesParts(totalDriverMinutesDisplay);
  const priceBreakdown = pricePreview?.breakdown ?? null;
  const priceCents = pricePreview?.breakdown?.totalCents ?? 0;

  useEffect(() => {
    if (bookingsPaused) {
      setPricePreview(null);
      setPricePreviewError(null);
      setPricePreviewLoading(false);
      return;
    }
    if (step !== 3 || !step3Complete) {
      setPricePreview(null);
      setPricePreviewError(null);
      setPricePreviewLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setPricePreviewLoading(true);
    setPricePreviewError(null);
    const tid = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/order-price-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: ctrl.signal,
            body: JSON.stringify({
              pickupAddress,
              deliveryAddress,
              pickupTime:
                data.pickupDate && data.pickupTime ? `${data.pickupDate}T${data.pickupTime}` : null,
              cargoSize: data.cargoSize,
              serviceType: data.serviceType || "driver_car",
              weightKg: data.cargoWeightKg,
              cargoCategory: data.cargoCategory,
            }),
          });
          const json = (await res.json()) as { error?: string } & Partial<OrderPricePreview>;
          if (!res.ok) {
            if (json.error === "BOOKINGS_PAUSED") throw new Error(t("bookingsPausedShort"));
            throw new Error(json.error || "preview failed");
          }
          if (!json.breakdown || typeof json.roundTripMinutes !== "number") {
            throw new Error("Invalid preview");
          }
          setPricePreview(json as OrderPricePreview);
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return;
          setPricePreview(null);
          setPricePreviewError(e instanceof Error ? e.message : "preview failed");
        } finally {
          if (!ctrl.signal.aborted) setPricePreviewLoading(false);
        }
      })();
    }, 400);
    return () => {
      clearTimeout(tid);
      ctrl.abort();
    };
  }, [
    step,
    step3Complete,
    pickupAddress,
    deliveryAddress,
    data.pickupDate,
    data.pickupTime,
    data.cargoSize,
    data.serviceType,
    data.cargoWeightKg,
    data.cargoCategory,
  ]);

  const fetchSuggestions = useCallback((query: string, setter: (s: Suggestion[]) => void) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setter([]);
      return;
    }
    // German PLZ is 5 digits: avoid noisy partial results until complete
    if (/^\d+$/.test(trimmed) && trimmed.length < 5) {
      setter([]);
      return;
    }
    const session = encodeURIComponent(placesSessionRef.current);
    fetch(`/api/address-suggestions?q=${encodeURIComponent(trimmed)}&session=${session}`)
      .then((r) => r.json())
      .then((raw: unknown) => {
        if (!Array.isArray(raw)) {
          setter([]);
          return;
        }
        setter(
          raw.map((x: unknown) => {
            const o = x as Record<string, unknown>;
            const display_name = typeof o.display_name === "string" ? o.display_name : "";
            const place_id = typeof o.place_id === "string" ? o.place_id : undefined;
            const lat = typeof o.lat === "number" ? o.lat : undefined;
            const lon = typeof o.lon === "number" ? o.lon : undefined;
            return { display_name, place_id, lat, lon };
          })
        );
      })
      .catch(() => setter([]));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (suggestionsOpen === "pickup") {
      debounceRef.current = setTimeout(() => {
        const raw = data.pickupAddressLine.trim();
        if (raw.length < 3) {
          setPickupSuggestions([]);
          return;
        }
        const q = /deutschland|germany/gi.test(raw) ? raw : `${raw}, Deutschland`;
        fetchSuggestions(q, setPickupSuggestions);
      }, 300);
    } else if (suggestionsOpen === "delivery") {
      debounceRef.current = setTimeout(() => {
        const raw = data.deliveryAddressLine.trim();
        if (raw.length < 3) {
          setDeliverySuggestions([]);
          return;
        }
        const q = /deutschland|germany/gi.test(raw) ? raw : `${raw}, Deutschland`;
        fetchSuggestions(q, setDeliverySuggestions);
      }, 300);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data.pickupAddressLine, data.deliveryAddressLine, suggestionsOpen, fetchSuggestions]);

  const fetchRealDistance = useCallback(
    async (departureOverride?: { pickupDate: string; pickupTime: string }) => {
    if (!pickupAddress.trim() || !deliveryAddress.trim()) return;
    setDistanceLoading(true);
    setDistanceError(null);
    setDistanceHint(null);
    const pd = departureOverride?.pickupDate ?? data.pickupDate;
    const pt = departureOverride?.pickupTime ?? data.pickupTime;
    const departureParam =
      pd && pt ? `&departure_time=${encodeURIComponent(`${pd}T${pt}`)}` : "";
    try {
      const res = await fetch(
        `/api/route-distance?pickup=${encodeURIComponent(pickupAddress)}&delivery=${encodeURIComponent(deliveryAddress)}${departureParam}&_=${Date.now()}`
      );
      const json = await res.json();
      if (res.ok && typeof json.distanceKm === "number" && json.distanceKm > 0) {
        update({ distanceKm: Math.round(json.distanceKm * 10) / 10 });
        setDistanceFromRoute(true);
        setRouteDurationMinutes(typeof json.durationMinutes === "number" ? json.durationMinutes : null);
        setDistanceHint(null);
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
        setDistanceHint(typeof json.hint === "string" ? json.hint : null);
      }
    } catch {
      setDistanceFromRoute(false);
      setRouteGeo(null);
      setRouteDurationMinutes(null);
      setDistanceError("Network error");
      setDistanceHint(null);
    } finally {
      setDistanceLoading(false);
    }
  },
  [pickupAddress, deliveryAddress, data.pickupDate, data.pickupTime]);

  // If we have distance but no map data (e.g. old API response), refetch once to get from/to for the map
  useEffect(() => {
    if (
      step !== 2 ||
      !pickupAddress.trim() ||
      !deliveryAddress.trim() ||
      !distanceFromRoute ||
      routeGeo != null
    ) {
      return;
    }
    let cancelled = false;
    fetch(
      `/api/route-distance?pickup=${encodeURIComponent(pickupAddress)}&delivery=${encodeURIComponent(deliveryAddress)}&_=${Date.now()}`
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
  }, [step, pickupAddress, deliveryAddress, distanceFromRoute, routeGeo]);

  const update = (partial: Partial<OrderFormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
    setError(null);
  };

  const applyPickupDateCommit = useCallback((): { ok: true; iso: string } | { ok: false } => {
    const parsed = parseOrderDateInputToIso(pickupDateField);
    if (parsed.kind === "invalid") {
      setError(t("pickupDateInvalid"));
      setPickupDateField(
        data.pickupDate ? formatIsoDateForOrderInput(data.pickupDate, locale) : ""
      );
      return { ok: false };
    }
    if (parsed.kind === "empty") {
      setData((prev) => ({ ...prev, pickupDate: "" }));
      setPickupDateField("");
      setError(null);
      return { ok: true, iso: "" };
    }
    const min = localTodayIso();
    if (parsed.iso < min) {
      setError(t("pickupDateInvalid"));
      setPickupDateField(
        data.pickupDate ? formatIsoDateForOrderInput(data.pickupDate, locale) : ""
      );
      return { ok: false };
    }
    setData((prev) => ({ ...prev, pickupDate: parsed.iso }));
    setPickupDateField(formatIsoDateForOrderInput(parsed.iso, locale));
    setError(null);
    return { ok: true, iso: parsed.iso };
  }, [pickupDateField, data.pickupDate, locale, t]);

  const handlePickupDateBlur = () => {
    void applyPickupDateCommit();
  };

  const MAX_CARGO_PHOTOS = 8;

  const uploadCargoPhotoFile = async (file: File) => {
    if (cargoPhotoUrls.length >= MAX_CARGO_PHOTOS) return;
    setPhotoUploading(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/order-cargo-photos/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: dataUrl, filename: file.name }),
      });
      const json = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) {
        if (json.error === "BOOKINGS_PAUSED") throw new Error(t("bookingsPausedShort"));
        throw new Error(json.error || "Upload failed");
      }
      const url = json.url;
      if (typeof url === "string") {
        setCargoPhotoUrls((prev) => [...prev, url]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setPhotoUploading(false);
    }
  };

  const next = () => {
    if (step < 4) {
      if (step === 1 && step1Complete) {
        setContactHistory((prev) =>
          mergePersistedContact(prev, {
            companyName: data.companyName.trim(),
            email: data.email.trim(),
            phoneCountryCode,
            phone: data.phone.trim(),
          })
        );
        setStep((s) => s + 1);
        return;
      }
      if (step === 2 && step2Complete) {
        const dateCommit = applyPickupDateCommit();
        if (!dateCommit.ok) return;
        setAddressHistory((prev) =>
          mergePersistedAddresses(prev, data.pickupAddressLine, data.deliveryAddressLine)
        );
        setDistanceLoading(true);
        const dep =
          dateCommit.iso && data.pickupTime
            ? { pickupDate: dateCommit.iso, pickupTime: data.pickupTime }
            : undefined;
        fetchRealDistance(dep).finally(() => {
          setDistanceLoading(false);
          setStep((s) => s + 1);
        });
      } else if (step !== 1) {
        setStep((s) => s + 1);
      }
    }
  };

  const back = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleConfirmOrder = async () => {
    if (bookingsPaused) {
      setError(t("bookingsPausedShort"));
      return;
    }
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
          pickupAddress,
          deliveryAddress,
          pickupTime: data.pickupDate && data.pickupTime ? `${data.pickupDate}T${data.pickupTime}` : null,
          cargoSize: data.cargoSize,
          serviceType: data.serviceType || "driver_car",
          distanceKm: data.distanceKm,
          priceCents,
          cargoDetails: {
            weightKg: data.cargoWeightKg,
            packageCount: data.packageCount,
            photoUrls: cargoPhotoUrls,
            cargoCategory: data.cargoCategory || null,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const err = json.error as string | undefined;
        if (err === "CARGO_CATEGORY_REQUIRED") throw new Error(t("cargoCategoryRequired"));
        if (err === "CARGO_WEIGHT_REQUIRED") throw new Error(t("cargoWeightRequired"));
        if (err === "CARGO_PACKAGES_REQUIRED") throw new Error(t("cargoPackagesRequired"));
        if (err === "CARGO_PHOTOS_REQUIRED") throw new Error(t("cargoPhotosRequired"));
        if (err === "BOOKINGS_PAUSED") throw new Error(t("bookingsPausedShort"));
        throw new Error(err || "Failed to confirm order");
      }
      if (json.jobId && json.confirmationToken && json.whatsappLink) {
        clearOrderFormDraft();
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
      {bookingsPaused && (
        <div
          className="mb-5 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-semibold">{t("bookingsPausedTitle")}</p>
          <p className="mt-1 text-amber-900/90">{t("bookingsPausedBody")}</p>
        </div>
      )}
      <div
        className={
          bookingsPaused && !orderConfirmed ? "pointer-events-none select-none opacity-[0.5]" : undefined
        }
      >
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
        <div className="relative space-y-4">
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
              onFocus={() => setContactSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setContactSuggestionsOpen(false), 200)}
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
              onFocus={() => setContactSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setContactSuggestionsOpen(false), 200)}
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
                onFocus={() => setContactSuggestionsOpen(true)}
                onBlur={() => setTimeout(() => setContactSuggestionsOpen(false), 200)}
                placeholder={t("whatsappPlaceholder")}
                className="min-w-0 flex-1 rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
          {contactSuggestionsOpen && contactFiltered.length > 0 && (
            <ul
              className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-auto rounded-lg border border-[#0d2137]/20 bg-white py-1 shadow-lg"
              dir={isRtlLocale ? "rtl" : "ltr"}
              lang={htmlLang}
            >
              <li className="pointer-events-none px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50">
                {t("contactHistorySection")}
              </li>
              {contactFiltered.map((c, i) => (
                <li key={`${c.email}-${i}`}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start gap-0.5 px-4 py-2 text-start text-sm hover:bg-[#0d2137]/5"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      applyContactSuggestion(c);
                    }}
                  >
                    <span className="font-medium text-[var(--foreground)]">{c.companyName}</span>
                    <span className="text-xs text-[var(--foreground)]/70">
                      {c.email} · {c.phoneCountryCode} {c.phone}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--primary)]">
            {t("step2")}
          </h2>
          <div className="space-y-2">
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {t("pickup")}
            </label>
            <div className="relative">
              <input
                type="text"
                autoComplete="off"
                name={addressLineInputNamesRef.current.pickup}
                value={data.pickupAddressLine}
                onChange={(e) => {
                  update({ pickupAddressLine: e.target.value });
                  setSuggestionsOpen("pickup");
                }}
                onFocus={() => setSuggestionsOpen("pickup")}
                onBlur={() => setTimeout(() => setSuggestionsOpen(null), 200)}
                placeholder={t("addressOneLinePlaceholder")}
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              {suggestionsOpen === "pickup" &&
                (pickupHistoryMatches.length > 0 || pickupApiSuggestionsDeduped.length > 0) && (
                  <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#0d2137]/20 bg-white py-1 shadow-lg">
                    {pickupHistoryMatches.length > 0 && (
                      <>
                        <li className="pointer-events-none px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50">
                          {t("addressHistorySection")}
                        </li>
                        {pickupHistoryMatches.map((line, i) => (
                          <li key={`hist-pu-${i}-${line.slice(0, 24)}`}>
                            <button
                              type="button"
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[#0d2137]/5"
                              onMouseDown={(ev) => {
                                ev.preventDefault();
                                applyAddressLineSuggestion("pickup", { display_name: line });
                              }}
                            >
                              {line}
                            </button>
                          </li>
                        ))}
                      </>
                    )}
                    {pickupApiSuggestionsDeduped.length > 0 && (
                      <>
                        {pickupHistoryMatches.length > 0 && (
                          <li className="pointer-events-none border-t border-[#0d2137]/10 px-3 py-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50">
                            {t("addressSuggestionsSection")}
                          </li>
                        )}
                        {pickupApiSuggestionsDeduped.map((s, i) => (
                          <li key={s.place_id || `api-pu-${i}`}>
                            <button
                              type="button"
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[#0d2137]/5"
                              onMouseDown={(ev) => {
                                ev.preventDefault();
                                applyAddressLineSuggestion("pickup", s);
                              }}
                            >
                              {s.display_name}
                            </button>
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {t("delivery")}
            </label>
            <div className="relative">
              <input
                type="text"
                autoComplete="off"
                name={addressLineInputNamesRef.current.delivery}
                value={data.deliveryAddressLine}
                onChange={(e) => {
                  update({ deliveryAddressLine: e.target.value });
                  setSuggestionsOpen("delivery");
                }}
                onFocus={() => setSuggestionsOpen("delivery")}
                onBlur={() => setTimeout(() => setSuggestionsOpen(null), 200)}
                placeholder={t("addressOneLinePlaceholder")}
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              {suggestionsOpen === "delivery" &&
                (deliveryHistoryMatches.length > 0 || deliveryApiSuggestionsDeduped.length > 0) && (
                  <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#0d2137]/20 bg-white py-1 shadow-lg">
                    {deliveryHistoryMatches.length > 0 && (
                      <>
                        <li className="pointer-events-none px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50">
                          {t("addressHistorySection")}
                        </li>
                        {deliveryHistoryMatches.map((line, i) => (
                          <li key={`hist-de-${i}-${line.slice(0, 24)}`}>
                            <button
                              type="button"
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[#0d2137]/5"
                              onMouseDown={(ev) => {
                                ev.preventDefault();
                                applyAddressLineSuggestion("delivery", { display_name: line });
                              }}
                            >
                              {line}
                            </button>
                          </li>
                        ))}
                      </>
                    )}
                    {deliveryApiSuggestionsDeduped.length > 0 && (
                      <>
                        {deliveryHistoryMatches.length > 0 && (
                          <li className="pointer-events-none border-t border-[#0d2137]/10 px-3 py-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50">
                            {t("addressSuggestionsSection")}
                          </li>
                        )}
                        {deliveryApiSuggestionsDeduped.map((s, i) => (
                          <li key={s.place_id || `api-de-${i}`}>
                            <button
                              type="button"
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[#0d2137]/5"
                              onMouseDown={(ev) => {
                                ev.preventDefault();
                                applyAddressLineSuggestion("delivery", s);
                              }}
                            >
                              {s.display_name}
                            </button>
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                {t("pickupDate")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                lang={htmlLang}
                placeholder={t("pickupDatePlaceholder")}
                value={pickupDateField}
                onChange={(e) => setPickupDateField(maskPickupDateInput(e.target.value))}
                onBlur={handlePickupDateBlur}
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                {t("pickupTime")}
              </label>
              <input
                type="time"
                lang={htmlLang}
                value={data.pickupTime}
                onChange={(e) => update({ pickupTime: e.target.value })}
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
          {step2Complete && (
            <>
              <div className="rounded-lg border border-[#0d2137]/15 bg-[#0d2137]/5 p-4">
                <button
                  type="button"
                  onClick={() => {
                    const r = applyPickupDateCommit();
                    if (!r.ok) return;
                    void fetchRealDistance(
                      r.iso && data.pickupTime
                        ? { pickupDate: r.iso, pickupTime: data.pickupTime }
                        : undefined
                    );
                  }}
                  disabled={distanceLoading}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-70"
                >
                  {distanceLoading ? "…" : t("calculateDistance")}
                </button>
                {distanceLoading && (
                  <div className="mt-4 border-t border-[#0d2137]/10 pt-4">
                    <OrderRouteLottie label={t("routeCalculating")} size="md" />
                  </div>
                )}
                {distanceFromRoute && (
                  <p className="mt-2 text-sm font-medium text-green-700">
                    {t("distanceRouteResult")}: {data.distanceKm} km
                  </p>
                )}
                {distanceError && !distanceLoading && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-amber-700">{t("distanceManualHint")}</p>
                    {distanceHint && (
                      <p className="text-xs text-amber-800/90 whitespace-pre-wrap">{distanceHint}</p>
                    )}
                  </div>
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
                update({ cargoCategory: id });
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
            <p className="mb-1 text-sm font-medium text-[var(--foreground)]">{t("cargoDetails")}</p>
            <p className="mb-3 text-xs text-amber-800">{t("cargoDetailsMandatoryHint")}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--foreground)]/80">{t("cargoWeightKg")} *</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={data.cargoWeightKg || ""}
                  onChange={(e) => update({ cargoWeightKg: Math.max(0, Number(e.target.value) || 0) })}
                  placeholder="250"
                  className="w-full rounded border border-[#0d2137]/20 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--foreground)]/80">{t("packageCount")} *</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={data.packageCount || ""}
                  onChange={(e) => update({ packageCount: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                  placeholder="1"
                  className="w-full rounded border border-[#0d2137]/20 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <label
                htmlFor={cargoPhotoInputId}
                className="mb-1 block text-xs font-medium text-[var(--foreground)]/80"
              >
                {t("cargoPhotosLabel")} *
              </label>
              <input
                ref={cargoPhotoInputRef}
                id={cargoPhotoInputId}
                type="file"
                accept="image/*"
                multiple
                disabled={photoUploading || cargoPhotoUrls.length >= MAX_CARGO_PHOTOS}
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files?.length) return;
                  void (async () => {
                    for (const f of Array.from(files)) {
                      if (cargoPhotoUrls.length >= MAX_CARGO_PHOTOS) break;
                      await uploadCargoPhotoFile(f);
                    }
                    e.target.value = "";
                  })();
                }}
                className="sr-only"
              />
              <div
                className="flex flex-wrap items-center gap-3"
                dir={isRtlLocale ? "rtl" : "ltr"}
                lang={htmlLang}
              >
                <button
                  type="button"
                  className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={photoUploading || cargoPhotoUrls.length >= MAX_CARGO_PHOTOS}
                  onClick={() => cargoPhotoInputRef.current?.click()}
                >
                  {t("cargoPhotosChooseButton")}
                </button>
                <span className="text-sm text-[var(--foreground)]/70" aria-live="polite">
                  {photoUploading
                    ? t("cargoPhotosStatusUploading")
                    : cargoPhotoUrls.length === 0
                      ? t("cargoPhotosStatusNone")
                      : t("cargoPhotosStatusCount", { count: cargoPhotoUrls.length })}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--foreground)]/60">{t("cargoPhotosHint", { max: MAX_CARGO_PHOTOS })}</p>
              {cargoPhotoUrls.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {cargoPhotoUrls.map((url, i) => (
                    <li key={url + i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-16 w-16 rounded border border-[#0d2137]/20 object-cover" />
                      <button
                        type="button"
                        aria-label={t("removePhoto")}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                        onClick={() => setCargoPhotoUrls((prev) => prev.filter((_, j) => j !== i))}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
            ) : step3Complete && pricePreviewLoading ? (
              <p className="text-sm text-[var(--foreground)]/75">{t("pricePreviewLoading")}</p>
            ) : (
              <>
                <p className="text-sm text-[var(--foreground)]/90">
                  {t("roundTripTime")}: {roundTripParts.hours} {t("hours")}{" "}
                  {roundTripParts.minutes} {t("minutes")}
                  {routeDurationMinutes != null && (
                    <span className="ml-1 text-green-700">({t("fromRoute")})</span>
                  )}
                  {pricePreview && (
                    <span className="ml-1 block text-xs text-[var(--foreground)]/60 sm:ml-1 sm:inline">
                      {t("routePricingAutoHint")}
                    </span>
                  )}
                </p>
                <p className="text-sm text-[var(--foreground)]/90">
                  {t("loadingUnloadingTime")}: {loadingMinutes} + {unloadingMinutes} {t("minutes")}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--accent)]">
                  {t("totalDriverTime")}: {totalTimeParts.hours} {t("hours")} {totalTimeParts.minutes} {t("minutes")}
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
          {showStep3Price && priceBreakdown ? (
            <div className="rounded-lg bg-[#0d2137]/5 p-4 space-y-1">
              <p className="text-sm text-[var(--foreground)]/80">{t("price")}</p>
              <p className="text-2xl font-bold text-[var(--accent)]">
                {formatPrice(priceCents)}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/5 p-4 space-y-2">
              {step3Complete && pricePreviewError && (
                <p className="text-sm text-red-700">{t("pricePreviewFailed")}</p>
              )}
              {step3Complete && pricePreviewLoading && (
                <p className="text-sm text-[var(--foreground)]/75">{t("pricePreviewLoading")}</p>
              )}
              {!step3Complete && (
                <p className="text-sm text-[var(--foreground)]/75">{t("priceCompleteAllFieldsHint")}</p>
              )}
            </div>
          )}
        </div>
      )}

      {step === 4 && !orderConfirmed && (
        <div className="relative space-y-4">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-[var(--background)]/85 p-6 backdrop-blur-sm">
              <OrderRouteLottie label={t("loading")} size="md" />
            </div>
          )}
          <h2 className="text-lg font-semibold text-[var(--primary)]">
            {t("step4")}
          </h2>
          <div className="flex flex-col gap-4 rounded-xl border border-[#0d2137]/10 bg-[#0d2137]/5 p-4 sm:flex-row sm:items-start">
            <div className="flex shrink-0 justify-center sm:w-[7.5rem] sm:pt-1">
              <OrderRouteLottie size="sm" className="opacity-95" />
            </div>
            <div className="min-w-0 flex-1 space-y-2 text-sm">
            <p><strong>{t("companyName")}:</strong> {data.companyName}</p>
            <p><strong>{t("email")}:</strong> {data.email}</p>
            <p><strong>{t("whatsapp")}:</strong> {data.phone.trim() ? normalizePhone(data.phone) : data.phone}</p>
            <p><strong>{t("pickup")}:</strong> {pickupAddress}</p>
            <p><strong>{t("delivery")}:</strong> {deliveryAddress}</p>
            {(data.pickupDate || data.pickupTime) && (
              <p>
                <strong>
                  {t("pickupDate")} / {t("pickupTime")}:
                </strong>{" "}
                {data.pickupDate
                  ? new Date(`${data.pickupDate}T12:00:00`).toLocaleDateString(htmlLang, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}{" "}
                {data.pickupTime ? data.pickupTime : ""}
              </p>
            )}
            <p><strong>{t("serviceType")}:</strong> {data.serviceType ? t(SERVICE_OPTIONS.find((o) => o.value === data.serviceType)?.key ?? "serviceDriverCar") : "—"}</p>
            {data.cargoCategory && (
              <p><strong>{t("cargoWhatToTransport")}:</strong> {t(CARGO_CATEGORIES.find((c) => c.id === data.cargoCategory)?.labelKey ?? "cargoCatGeneralOther")}</p>
            )}
            <p><strong>{t("cargoSize")}:</strong> {t(`cargo${data.cargoSize}` as "cargoXS")}</p>
            <p>
              <strong>{t("cargoDetails")}:</strong> {data.cargoWeightKg} kg · {t("packageCount")}: {data.packageCount} ·{" "}
              {t("cargoPhotosLabel")}: {cargoPhotoUrls.length}
            </p>
            <p><strong>{t("distance")}:</strong> {data.distanceKm} km</p>
            <p className="pt-2 text-lg font-bold text-[var(--accent)]">
              {t("total")}: {formatPrice(priceCents)}
            </p>
            </div>
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
      </div>

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
            disabled={bookingsPaused || step === 1}
            className="rounded-lg border border-[#0d2137]/20 px-4 py-2 text-sm font-medium text-[var(--foreground)] disabled:opacity-50"
          >
            {t("back")}
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              disabled={
                bookingsPaused ||
                distanceLoading ||
                (step === 1 && !step1Complete) ||
                (step === 2 && !step2Complete) ||
                (step === 3 &&
                  (!step3Complete ||
                    !pricePreview ||
                    pricePreviewLoading ||
                    !!pricePreviewError))
              }
              className="rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {distanceLoading ? "…" : t("next")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={bookingsPaused || loading || !confirmChecked}
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
