"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useId } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { OrderRouteLottie } from "@/components/OrderRouteLottie";
import { GermanVatPriceBlock } from "@/components/GermanVatPriceBlock";
import {
  type ServiceType,
  type PricingOptions,
  type PriceBreakdown,
  formatPrice,
} from "@/lib/pricing";
import {
  emptyCargoLoadLine,
  isCargoLoadLineComplete,
  LOAD_CARRIERS,
  LOAD_UNLOAD_TOTAL_MINUTES,
  normalizeCargoLoadLine,
  summarizeCargoLoads,
  serviceTypeFromLoadCarriers,
  type CargoLoadLine,
  type LoadCarrierId,
} from "@/lib/cargo";
import {
  loadOrderAddressHistory,
  mergePersistedAddresses,
  filterAddressHistoryForQuery,
  appendOrderAddressLine,
  saveOrderAddressHistory,
} from "@/lib/order-address-history";
import { OrderFullAddressFields } from "@/components/OrderFullAddressFields";
import { OrderSuccessHandshake } from "@/components/OrderSuccessHandshake";
import {
  EMPTY_STRUCTURED_ADDRESS,
  formatStructuredAddressLine,
  formatStructuredAddressPlain,
  isStructuredAddressComplete,
  normalizeStructuredAddress,
  parseStructuredAddressFromLine,
  splitStreetHouse,
  type StructuredAddress,
} from "@/lib/structured-address";
import { localeToHtmlLang } from "@/lib/locale-html-lang";
import { GOOGLE_WRITE_REVIEW_URL } from "@/lib/google-review";
import { displayOrderRef } from "@/lib/order-ref";
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
  city?: string | null;
  country?: string | null;
};
type RouteGeo = {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  geometry: GeoJSON.LineString | null;
};

type CargoSize = "XS" | "M" | "L";
/** Single vehicle class offered on the order form: 3.5 t van. */
const FIXED_CARGO_SIZE: CargoSize = "L";

const DEFAULT_KM = 50;

/** Append country for geocoding when the customer omits it */
function addressLineForGeocode(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/deutschland|germany/gi.test(t)) return t;
  return `${t}, Deutschland`;
}

function streetNameKey(street: string, houseNumber = ""): string {
  const fromSplit = splitStreetHouse(`${street} ${houseNumber}`.trim()).street;
  return (fromSplit || street).trim().toLowerCase();
}

function isSameStreetName(prev: StructuredAddress, nextStreet: string): boolean {
  const prevKey = streetNameKey(prev.street, prev.houseNumber);
  const nextKey = streetNameKey(nextStreet);
  if (!prevKey || !nextKey) return false;
  return nextKey === prevKey || nextKey.startsWith(prevKey) || prevKey.startsWith(nextKey);
}

function structuredFromPlaceDetails(j: PlaceDetailsJson, prev: StructuredAddress): StructuredAddress {
  const fromFmt = j.formatted_address ? parseStructuredAddressFromLine(j.formatted_address) : EMPTY_STRUCTURED_ADDRESS;
  const rawStreet = j.street?.trim() || fromFmt.street || "";
  const split = splitStreetHouse(rawStreet);
  const houseNumber = j.houseNumber?.trim() || split.houseNumber || fromFmt.houseNumber || "";
  const postalCode =
    j.postcode?.trim().replace(/\D/g, "").slice(0, 5) || fromFmt.postalCode || "";
  const city = j.city?.trim() || fromFmt.city || "";
  const country = j.country?.trim() || fromFmt.country || "Deutschland";
  return {
    ...prev,
    street: split.street || rawStreet,
    houseNumber,
    postalCode,
    city,
    country: country || "Deutschland",
  };
}

function expandPastedStreet(next: StructuredAddress, prev: StructuredAddress): StructuredAddress {
  if (next.street === prev.street) return next;
  if (/\d{5}/.test(next.street)) {
    const parsed = parseStructuredAddressFromLine(next.street);
    if (parsed.street || parsed.postalCode || parsed.city) {
      return {
        ...next,
        street: parsed.street || splitStreetHouse(next.street).street || next.street,
        houseNumber: parsed.houseNumber,
        postalCode: parsed.postalCode,
        city: parsed.city,
        country: parsed.country || next.country || "Deutschland",
      };
    }
  }
  const split = splitStreetHouse(next.street);
  const keepArea = isSameStreetName(prev, split.street || next.street);
  return {
    ...next,
    street: split.street || next.street,
    houseNumber: split.houseNumber || (keepArea ? next.houseNumber : ""),
    postalCode: keepArea ? next.postalCode : "",
    city: keepArea ? next.city : "",
  };
}

function lineFromPlaceDetails(j: PlaceDetailsJson, displayFallback: string): string {
  const filled = structuredFromPlaceDetails(j, EMPTY_STRUCTURED_ADDRESS);
  if (isStructuredAddressComplete(filled)) return formatStructuredAddressLine(filled);
  const fa = j.formatted_address?.trim();
  if (fa) return fa;
  return displayFallback;
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
  /** Full pickup line: street, house no., postcode (and city), one field */
  pickupAddressLine: string;
  deliveryAddressLine: string;
  pickupAddr: StructuredAddress;
  deliveryAddr: StructuredAddress;
  pickupDate: string;
  pickupTime: string;
  deliveryDate: string;
  deliveryTime: string;
  cargoSize: CargoSize;
  loads: CargoLoadLine[];
  serviceType: ServiceType | "";
  distanceKm: number;
};

const initial: OrderFormData = {
  companyName: "",
  email: "",
  phone: "",
  pickupAddressLine: "",
  deliveryAddressLine: "",
  pickupAddr: { ...EMPTY_STRUCTURED_ADDRESS },
  deliveryAddr: { ...EMPTY_STRUCTURED_ADDRESS },
  pickupDate: "",
  pickupTime: "",
  deliveryDate: "",
  deliveryTime: "",
  cargoSize: FIXED_CARGO_SIZE,
  loads: [emptyCargoLoadLine()],
  serviceType: "driver_car" as ServiceType,
  distanceKm: DEFAULT_KM,
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
  const companyNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const pickupAddressRef = useRef<HTMLInputElement>(null);
  const deliveryAddressRef = useRef<HTMLInputElement>(null);
  const loadsRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<HTMLDivElement>(null);
  const [step1Attempted, setStep1Attempted] = useState(false);
  const [step2Attempted, setStep2Attempted] = useState(false);
  const [step3Attempted, setStep3Attempted] = useState(false);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OrderFormData>(initial);
  const [pickupDateField, setPickupDateField] = useState("");
  const [deliveryDateField, setDeliveryDateField] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<{
    jobId: string;
    orderNumber: number | null;
    token: string;
    whatsappLink: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [deliverySuggestions, setDeliverySuggestions] = useState<Suggestion[]>([]);
  const [addressHistory, setAddressHistory] = useState<string[]>([]);
  const [contactHistory, setContactHistory] = useState<OrderContactEntry[]>([]);
  const [contactSuggestionsOpen, setContactSuggestionsOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState<
    "pickup-street" | "pickup-plz" | "delivery-street" | "delivery-plz" | null
  >(null);
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
  const suggestionsCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelAddressSuggestionsClose = useCallback(() => {
    if (suggestionsCloseTimerRef.current) {
      clearTimeout(suggestionsCloseTimerRef.current);
      suggestionsCloseTimerRef.current = null;
    }
  }, []);

  const closeAddressSuggestions = useCallback(() => {
    cancelAddressSuggestionsClose();
    setSuggestionsOpen(null);
    setPickupSuggestions([]);
    setDeliverySuggestions([]);
  }, [cancelAddressSuggestionsClose]);

  const scheduleAddressSuggestionsClose = useCallback(() => {
    cancelAddressSuggestionsClose();
    suggestionsCloseTimerRef.current = setTimeout(() => {
      setSuggestionsOpen(null);
      setPickupSuggestions([]);
      setDeliverySuggestions([]);
    }, 180);
  }, [cancelAddressSuggestionsClose]);

  useEffect(() => () => cancelAddressSuggestionsClose(), [cancelAddressSuggestionsClose]);
  /** Links Google Autocomplete + Place Details billing sessions */
  const placesSessionRef = useRef(
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `tp24-${Date.now()}`
  );
  const pickupAddress = useMemo(() => addressLineForGeocode(data.pickupAddressLine), [data.pickupAddressLine]);
  const deliveryAddress = useMemo(() => addressLineForGeocode(data.deliveryAddressLine), [data.deliveryAddressLine]);
  const plzCityLockRef = useRef({ pickup: "", delivery: "" });

  const fillCityFromPostcode = useCallback((field: "pickup" | "delivery", postalCode: string, currentCity: string) => {
    const pc = postalCode.replace(/\D/g, "").slice(0, 5);
    if (!/^\d{5}$/.test(pc)) {
      plzCityLockRef.current[field] = "";
      return;
    }
    if (currentCity.trim() && plzCityLockRef.current[field] === pc) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/postcode-locality?postcode=${encodeURIComponent(pc)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((j: { city?: string | null }) => {
          const city = typeof j.city === "string" ? j.city.trim() : "";
          if (!city) return;
          setData((prev) => {
            const keyAddr = field === "pickup" ? "pickupAddr" : "deliveryAddr";
            const keyLine = field === "pickup" ? "pickupAddressLine" : "deliveryAddressLine";
            const addr = prev[keyAddr];
            if (addr.postalCode !== pc) return prev;
            if (addr.city.trim() && plzCityLockRef.current[field] === pc) return prev;
            plzCityLockRef.current[field] = pc;
            const nextAddr = { ...addr, city, country: addr.country || "Deutschland" };
            return { ...prev, [keyAddr]: nextAddr, [keyLine]: formatStructuredAddressLine(nextAddr) };
          });
        })
        .catch(() => {});
    }, 220);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  useEffect(
    () => fillCityFromPostcode("pickup", data.pickupAddr.postalCode, data.pickupAddr.city),
    [data.pickupAddr.postalCode, data.pickupAddr.city, fillCityFromPostcode],
  );
  useEffect(
    () => fillCityFromPostcode("delivery", data.deliveryAddr.postalCode, data.deliveryAddr.city),
    [data.deliveryAddr.postalCode, data.deliveryAddr.city, fillCityFromPostcode],
  );

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
      const rawData = d.data as OrderFormData & { pickupAddr?: unknown; deliveryAddr?: unknown };
      const pickupAddr = rawData.pickupAddr
        ? normalizeStructuredAddress(rawData.pickupAddr)
        : parseStructuredAddressFromLine(rawData.pickupAddressLine || "");
      const deliveryAddr = rawData.deliveryAddr
        ? normalizeStructuredAddress(rawData.deliveryAddr)
        : parseStructuredAddressFromLine(rawData.deliveryAddressLine || "");
      setData({
        ...rawData,
        cargoSize: FIXED_CARGO_SIZE,
        pickupAddr,
        deliveryAddr,
        pickupAddressLine: formatStructuredAddressLine(pickupAddr) || rawData.pickupAddressLine || "",
        deliveryAddressLine: formatStructuredAddressLine(deliveryAddr) || rawData.deliveryAddressLine || "",
        loads:
          Array.isArray(rawData.loads) && rawData.loads.length > 0
            ? rawData.loads.map(normalizeCargoLoadLine)
            : [emptyCargoLoadLine()],
      });
      setPickupDateField(maskPickupDateInput(d.pickupDateField));
      setDeliveryDateField(maskPickupDateInput(d.deliveryDateField ?? ""));
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
    if (!draftRestored) return;
    setDeliveryDateField((display) => {
      if (!data.deliveryDate) return display;
      return formatIsoDateForOrderInput(data.deliveryDate, locale);
    });
  }, [draftRestored, locale, data.deliveryDate]);

  useEffect(() => {
    if (!draftRestored || orderConfirmed) return;
    const tid = setTimeout(() => {
      saveOrderFormDraft({
        v: 1,
        step,
        data,
        pickupDateField,
        deliveryDateField,
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
    deliveryDateField,
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

  const pickupHistoryMatches = useMemo(() => {
    const sibling = formatStructuredAddressLine(data.deliveryAddr) || data.deliveryAddressLine;
    const siblingKey = sibling.trim().toLowerCase().replace(/\s+/g, " ");
    return filterAddressHistoryForQuery(
      addressHistory,
      data.pickupAddr.street || data.pickupAddr.postalCode || data.pickupAddressLine,
      10
    ).filter((line) => line.trim().toLowerCase().replace(/\s+/g, " ") !== siblingKey);
  }, [
    addressHistory,
    data.pickupAddr.street,
    data.pickupAddr.postalCode,
    data.pickupAddressLine,
    data.deliveryAddr,
    data.deliveryAddressLine,
  ]);
  const deliveryHistoryMatches = useMemo(() => {
    const sibling = formatStructuredAddressLine(data.pickupAddr) || data.pickupAddressLine;
    const siblingKey = sibling.trim().toLowerCase().replace(/\s+/g, " ");
    return filterAddressHistoryForQuery(
      addressHistory,
      data.deliveryAddr.street || data.deliveryAddr.postalCode || data.deliveryAddressLine,
      10
    ).filter((line) => line.trim().toLowerCase().replace(/\s+/g, " ") !== siblingKey);
  }, [
    addressHistory,
    data.deliveryAddr.street,
    data.deliveryAddr.postalCode,
    data.deliveryAddressLine,
    data.pickupAddr,
    data.pickupAddressLine,
  ]);

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

  const persistAddressLine = useCallback((line: string) => {
    setAddressHistory((prev) => {
      const next = appendOrderAddressLine(prev, line);
      if (next === prev) return prev;
      saveOrderAddressHistory(next);
      return next;
    });
  }, []);

  const applyAddressLineSuggestion = useCallback((field: "pickup" | "delivery", s: Suggestion) => {
    void (async () => {
      const rotateSession = () => {
        placesSessionRef.current =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `tp24-${Date.now()}`;
      };
      const keyLine = field === "pickup" ? "pickupAddressLine" : "deliveryAddressLine";
      const keyAddr = field === "pickup" ? "pickupAddr" : "deliveryAddr";
      let stored = (s.display_name || "").trim();
      try {
        if (s.place_id) {
          const res = await fetch(
            `/api/place-details?place_id=${encodeURIComponent(s.place_id)}&session=${encodeURIComponent(placesSessionRef.current)}`
          );
          const j = (await res.json()) as PlaceDetailsJson;
          rotateSession();
          stored = lineFromPlaceDetails(j, stored).trim() || stored;
          setData((prev) => {
            const nextAddr = structuredFromPlaceDetails(j, field === "pickup" ? prev.pickupAddr : prev.deliveryAddr);
            return {
              ...prev,
              [keyAddr]: nextAddr,
              [keyLine]: formatStructuredAddressLine(nextAddr) || stored,
            };
          });
          setError(null);
        } else {
          const parsed = parseStructuredAddressFromLine(stored);
          setData((prev) => {
            const prevAddr = field === "pickup" ? prev.pickupAddr : prev.deliveryAddr;
            const nextAddr = {
              ...parsed,
              company: prevAddr.company,
              phone: prevAddr.phone,
              notes: prevAddr.notes,
            };
            return {
              ...prev,
              [keyAddr]: nextAddr,
              [keyLine]: formatStructuredAddressLine(nextAddr) || stored,
            };
          });
          setError(null);
        }
      } catch {
        const parsed = parseStructuredAddressFromLine(stored);
        setData((prev) => {
          const prevAddr = field === "pickup" ? prev.pickupAddr : prev.deliveryAddr;
          const nextAddr = {
            ...parsed,
            company: prevAddr.company,
            phone: prevAddr.phone,
            notes: prevAddr.notes,
          };
          return {
            ...prev,
            [keyAddr]: nextAddr,
            [keyLine]: formatStructuredAddressLine(nextAddr) || stored || (field === "pickup" ? prev.pickupAddressLine : prev.deliveryAddressLine),
          };
        });
        setError(null);
      }
      persistAddressLine(stored);
      closeAddressSuggestions();
    })();
  }, [persistAddressLine, closeAddressSuggestions]);

  const normalizePhone = (value: string, countryCode: string = phoneCountryCode) => {
    const digits = value.replace(/\D/g, "");
    if (!digits.length) return value.trim();
    const prefix = countryCode.replace(/\D/g, "");
    if (digits.startsWith(prefix) && digits.length > prefix.length) return `+${digits}`;
    if (digits.startsWith("0")) return `${countryCode}${digits.slice(1)}`;
    return `${countryCode}${digits}`;
  };

  const loads = data.loads?.length ? data.loads : [emptyCargoLoadLine()];
  const loadSummary = useMemo(() => summarizeCargoLoads(loads), [loads]);
  const loadsComplete = loads.length > 0 && loads.every(isCargoLoadLineComplete);
  const resolvedServiceType = useMemo(
    () => serviceTypeFromLoadCarriers(loads.map((l) => l.loadCarrier)),
    [loads]
  );

  const updateLoad = useCallback((index: number, patch: Partial<CargoLoadLine>) => {
    setData((prev) => {
      const next = [...(prev.loads?.length ? prev.loads : [emptyCargoLoadLine()])];
      next[index] = { ...next[index], ...patch };
      return { ...prev, loads: next };
    });
  }, []);

  const step1Complete = data.companyName.trim() !== "" && data.email.trim() !== "" && data.phone.trim() !== "";
  const pickupScheduleReady =
    parseOrderDateInputToIso(pickupDateField).kind === "valid" && Boolean(data.pickupTime.trim());
  const step2Complete =
    isStructuredAddressComplete(data.pickupAddr) &&
    isStructuredAddressComplete(data.deliveryAddr) &&
    (data.deliveryAddr.phone ?? "").replace(/\D/g, "").length >= 6 &&
    parseOrderDateInputToIso(pickupDateField).kind === "valid" &&
    Boolean(data.pickupTime.trim()) &&
    parseOrderDateInputToIso(deliveryDateField).kind === "valid" &&
    Boolean(data.deliveryTime.trim());
  const step3Complete =
    distanceFromRoute &&
    loadsComplete &&
    cargoPhotoUrls.length >= 1;

  const step3MissingFields = useMemo(() => {
    const missing: string[] = [];
    if (!loadsComplete) missing.push(t("cargoDetails"));
    if (cargoPhotoUrls.length < 1) missing.push(t("cargoPhotosLabel"));
    if (!distanceFromRoute) missing.push(t("distanceRoute"));
    return missing;
  }, [
    cargoPhotoUrls.length,
    distanceFromRoute,
    loadsComplete,
    t,
  ]);

  const missingFieldClass = (attempted: boolean, missing: boolean) =>
    attempted && missing
      ? "border-red-500 bg-red-50 ring-2 ring-red-400/70 focus:border-red-600 focus:ring-red-500"
      : "border-[#0d2137]/20";

  const step3FieldWarn = useCallback(
    (needsAttention: boolean) =>
      step3Attempted && needsAttention
        ? "border-red-500 ring-2 ring-red-400/70"
        : "border-[#0d2137]/20",
    [step3Attempted],
  );

  const focusStep3FirstMissing = useCallback((): boolean => {
    setStep3Attempted(true);
    if (!loadsComplete) {
      setError(t("step3Incomplete"));
      loadsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    if (cargoPhotoUrls.length < 1) {
      setError(t("step3Incomplete"));
      photosRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      cargoPhotoInputRef.current?.focus();
      return false;
    }
    if (!distanceFromRoute) {
      setError(t("driverTimeRequiresAddress"));
      setStep(2);
      return false;
    }
    setError(null);
    return true;
  }, [
    cargoPhotoUrls.length,
    distanceFromRoute,
    loadsComplete,
    t,
  ]);

  const showStep3Price = step3Complete && !!pricePreview && !pricePreviewLoading && !pricePreviewError;

  const loadUnloadMinutes = LOAD_UNLOAD_TOTAL_MINUTES;
  const priceBreakdown = pricePreview?.breakdown ?? null;
  const priceCents = pricePreview?.breakdown?.totalCents ?? 0;

  useEffect(() => {
    if (bookingsPaused) {
      setPricePreview(null);
      setPricePreviewError(null);
      setPricePreviewLoading(false);
      return;
    }
    if ((step !== 3 && step !== 4) || !step3Complete) {
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
              cargoSize: FIXED_CARGO_SIZE,
              serviceType: resolvedServiceType,
              weightKg: loadSummary.weightKg,
              cargoCategory: loadSummary.cargoCategory,
              loadCarriers: loads.map((l) => l.loadCarrier).filter(Boolean),
              distanceKm: distanceFromRoute ? data.distanceKm : undefined,
              durationMinutes: distanceFromRoute ? routeDurationMinutes : undefined,
            }),
          });
          const json = (await res.json()) as { error?: string } & Partial<OrderPricePreview>;
          if (!res.ok) {
            if (json.error === "BOOKINGS_PAUSED") throw new Error(t("bookingsPausedShort"));
            if (json.error === "ROUTE_FAILED") throw new Error(t("pricePreviewFailed"));
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
    resolvedServiceType,
    loadSummary.weightKg,
    loadSummary.cargoCategory,
    data.distanceKm,
    distanceFromRoute,
    routeDurationMinutes,
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
    if (!suggestionsOpen) return;
    debounceRef.current = setTimeout(() => {
      const isPickup = suggestionsOpen.startsWith("pickup");
      const viaPlz = suggestionsOpen.endsWith("plz");
      const addr = isPickup ? data.pickupAddr : data.deliveryAddr;
      const setter = isPickup ? setPickupSuggestions : setDeliverySuggestions;
      const q = viaPlz
        ? addr.postalCode.trim()
        : [addr.street, addr.houseNumber, addr.postalCode, addr.city].filter(Boolean).join(" ").trim();
      if (viaPlz && q.length < 5) {
        setter([]);
        return;
      }
      if (!viaPlz && q.length < 3) {
        setter([]);
        return;
      }
      fetchSuggestions(q, setter);
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data.pickupAddr, data.deliveryAddr, suggestionsOpen, fetchSuggestions]);

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
      setError(t("pickupDateInvalid"));
      return { ok: false };
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

  const applyDeliveryDateCommit = useCallback((): { ok: true; iso: string } | { ok: false } => {
    const pickupParsed = parseOrderDateInputToIso(pickupDateField);
    if (pickupParsed.kind !== "valid" || !data.pickupTime.trim()) {
      setError(t("pickupDateInvalid"));
      return { ok: false };
    }
    const parsed = parseOrderDateInputToIso(deliveryDateField);
    if (parsed.kind === "invalid" || parsed.kind === "empty") {
      setError(t("deliveryDateInvalid"));
      setDeliveryDateField(
        data.deliveryDate ? formatIsoDateForOrderInput(data.deliveryDate, locale) : ""
      );
      return { ok: false };
    }
    const min = localTodayIso();
    if (parsed.iso < min) {
      setError(t("deliveryDateInvalid"));
      setDeliveryDateField(
        data.deliveryDate ? formatIsoDateForOrderInput(data.deliveryDate, locale) : ""
      );
      return { ok: false };
    }
    setData((prev) => ({ ...prev, deliveryDate: parsed.iso }));
    setDeliveryDateField(formatIsoDateForOrderInput(parsed.iso, locale));
    setError(null);
    return { ok: true, iso: parsed.iso };
  }, [deliveryDateField, data.deliveryDate, data.pickupTime, pickupDateField, locale, t]);

  const handleDeliveryDateBlur = () => {
    void applyDeliveryDateCommit();
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
    if (step >= 4) return;

    if (step === 1) {
      setStep1Attempted(true);
      if (!step1Complete) {
        setError(t("step1Incomplete"));
        if (!data.companyName.trim()) {
          companyNameRef.current?.focus();
          companyNameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (!data.email.trim()) {
          emailRef.current?.focus();
          emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          phoneRef.current?.focus();
          phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      setError(null);
      setContactHistory((prev) =>
        mergePersistedContact(prev, {
          companyName: data.companyName.trim(),
          email: data.email.trim(),
          phoneCountryCode,
          phone: data.phone.trim(),
        }),
      );
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep2Attempted(true);
      if (!step2Complete) {
        setError(t("step2Incomplete"));
        if (!isStructuredAddressComplete(data.pickupAddr)) {
          pickupAddressRef.current?.focus();
          pickupAddressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          deliveryAddressRef.current?.focus();
          deliveryAddressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      setError(null);
      const dateCommit = applyPickupDateCommit();
      if (!dateCommit.ok) return;
      if (!data.pickupTime.trim()) {
        setError(t("step2Incomplete"));
        return;
      }
      const deliveryCommit = applyDeliveryDateCommit();
      if (!deliveryCommit.ok) return;
      if (!data.deliveryTime.trim()) {
        setError(t("step2Incomplete"));
        return;
      }
      if (deliveryCommit.iso < dateCommit.iso) {
        setError(t("deliveryDateInvalid"));
        return;
      }
      setAddressHistory((prev) =>
        mergePersistedAddresses(prev, data.pickupAddressLine, data.deliveryAddressLine),
      );
      setDistanceLoading(true);
      const dep = { pickupDate: dateCommit.iso, pickupTime: data.pickupTime };
      fetchRealDistance(dep).finally(() => {
        setDistanceLoading(false);
        setStep(3);
      });
      return;
    }

    if (step === 3) {
      if (!focusStep3FirstMissing()) return;
      if (pricePreviewLoading) return;
      if (!pricePreview || pricePreviewError) {
        setError(pricePreviewError || t("pricePreviewFailed"));
        return;
      }
      setError(null);
      setStep(4);
    }
  };

  const back = () => {
    if (step > 1) {
      if (step === 4) setStep3Attempted(false);
      setStep((s) => s - 1);
    }
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
          deliveryTime: data.deliveryDate && data.deliveryTime ? `${data.deliveryDate}T${data.deliveryTime}` : null,
          cargoSize: FIXED_CARGO_SIZE,
          serviceType: resolvedServiceType,
          distanceKm: data.distanceKm,
          priceCents,
          cargoDetails: {
            loads,
            weightKg: loadSummary.weightKg,
            packageCount: loadSummary.packageCount,
            photoUrls: cargoPhotoUrls,
            cargoCategory: loadSummary.cargoCategory || null,
            cargoLengthCm: loadSummary.cargoLengthCm,
            cargoWidthCm: loadSummary.cargoWidthCm,
            cargoHeightCm: loadSummary.cargoHeightCm,
            stackable: loadSummary.stackable,
            dangerousGoods: loadSummary.dangerousGoods,
            senderAddress: { ...data.pickupAddr, company: data.companyName.trim() },
            recipientAddress: data.deliveryAddr,
            preferred_delivery_at:
              data.deliveryDate && data.deliveryTime ? `${data.deliveryDate}T${data.deliveryTime}` : null,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const err = json.error as string | undefined;
        if (err === "CARGO_LOADS_REQUIRED") throw new Error(t("cargoLoadsRequired"));
        if (err === "CARGO_CATEGORY_REQUIRED") throw new Error(t("cargoLoadsRequired"));
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
          orderNumber: typeof json.orderNumber === "number" ? json.orderNumber : null,
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
              ref={companyNameRef}
              type="text"
              value={data.companyName}
              onChange={(e) => update({ companyName: e.target.value })}
              onFocus={() => setContactSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setContactSuggestionsOpen(false), 200)}
              placeholder={t("companyNamePlaceholder")}
              className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-1 ${
                missingFieldClass(step1Attempted, !data.companyName.trim())
              } ${step1Attempted && !data.companyName.trim() ? "" : "focus:border-[var(--accent)] focus:ring-[var(--accent)]"}`}
              aria-invalid={step1Attempted && !data.companyName.trim()}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {t("email")}
            </label>
            <input
              ref={emailRef}
              type="email"
              value={data.email}
              onChange={(e) => update({ email: e.target.value })}
              onFocus={() => setContactSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setContactSuggestionsOpen(false), 200)}
              placeholder={t("emailPlaceholder")}
              className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-1 ${
                missingFieldClass(step1Attempted, !data.email.trim())
              } ${step1Attempted && !data.email.trim() ? "" : "focus:border-[var(--accent)] focus:ring-[var(--accent)]"}`}
              aria-invalid={step1Attempted && !data.email.trim()}
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
                ref={phoneRef}
                type="tel"
                value={data.phone}
                onChange={(e) => update({ phone: e.target.value })}
                onFocus={() => setContactSuggestionsOpen(true)}
                onBlur={() => setTimeout(() => setContactSuggestionsOpen(false), 200)}
                placeholder={t("whatsappPlaceholder")}
                className={`min-w-0 flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-1 ${
                  step1Attempted && !data.phone.trim()
                    ? "border-red-500 bg-red-50 ring-2 ring-red-400/70 focus:border-red-600 focus:ring-red-500"
                    : "border-[#0d2137]/20 focus:border-[var(--accent)] focus:ring-[var(--accent)]"
                }`}
                aria-invalid={step1Attempted && !data.phone.trim()}
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
          <OrderFullAddressFields
            title={t("senderFullTitle")}
            value={data.pickupAddr}
            notesLabel={t("addressLoadingNotes")}
            highlightMissing={step2Attempted}
            hideCompany
            streetInputRef={pickupAddressRef}
            streetName={addressLineInputNamesRef.current.pickup}
            postalName="tp24-pickup-plz"
            onStreetFocus={() => {
              cancelAddressSuggestionsClose();
              setAddressHistory(loadOrderAddressHistory());
              setSuggestionsOpen("pickup-street");
            }}
            onStreetBlur={scheduleAddressSuggestionsClose}
            onPostalFocus={() => {
              cancelAddressSuggestionsClose();
              setAddressHistory(loadOrderAddressHistory());
              setSuggestionsOpen("pickup-plz");
            }}
            onPostalBlur={scheduleAddressSuggestionsClose}
            onChange={(next) => {
              const expanded = expandPastedStreet(next, data.pickupAddr);
              update({ pickupAddr: expanded, pickupAddressLine: formatStructuredAddressLine(expanded) });
              if (isStructuredAddressComplete(expanded) && next.street !== data.pickupAddr.street && /\d{5}/.test(next.street)) {
                setSuggestionsOpen(null);
                return;
              }
              if (next.postalCode !== data.pickupAddr.postalCode) setSuggestionsOpen("pickup-plz");
              else if (next.street !== data.pickupAddr.street) setSuggestionsOpen("pickup-street");
            }}
            labels={{
              company: t("addressCompany"),
              street: t("addressStreet"),
              streetPlaceholder: t("addressStreetPlaceholder"),
              houseNumber: t("addressHouseNumber"),
              houseNumberPlaceholder: t("addressHouseNumberPlaceholder"),
              postalCode: t("addressPostalCode"),
              city: t("addressCity"),
              country: t("addressCountry"),
            }}
            streetSuggestions={
              suggestionsOpen === "pickup-street" &&
              (pickupHistoryMatches.length > 0 || pickupApiSuggestionsDeduped.length > 0) ? (
                <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#0d2137]/20 bg-white py-1 shadow-lg">
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
              ) : null
            }
            postalSuggestions={
              suggestionsOpen === "pickup-plz" && pickupApiSuggestionsDeduped.length > 0 ? (
                <ul className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#0d2137]/20 bg-white py-1 shadow-lg">
                  {pickupApiSuggestionsDeduped.map((s, i) => (
                    <li key={s.place_id || `api-pu-plz-${i}`}>
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
                </ul>
              ) : null
            }
          />
          <OrderFullAddressFields
            title={t("recipientFullTitle")}
            value={data.deliveryAddr}
            notesLabel={t("addressUnloadingNotes")}
            highlightMissing={step2Attempted}
            phoneRequired
            streetInputRef={deliveryAddressRef}
            streetName={addressLineInputNamesRef.current.delivery}
            postalName="tp24-delivery-plz"
            onStreetFocus={() => {
              cancelAddressSuggestionsClose();
              setAddressHistory(loadOrderAddressHistory());
              setSuggestionsOpen("delivery-street");
            }}
            onStreetBlur={scheduleAddressSuggestionsClose}
            onPostalFocus={() => {
              cancelAddressSuggestionsClose();
              setAddressHistory(loadOrderAddressHistory());
              setSuggestionsOpen("delivery-plz");
            }}
            onPostalBlur={scheduleAddressSuggestionsClose}
            onChange={(next) => {
              const expanded = expandPastedStreet(next, data.deliveryAddr);
              update({ deliveryAddr: expanded, deliveryAddressLine: formatStructuredAddressLine(expanded) });
              if (isStructuredAddressComplete(expanded) && next.street !== data.deliveryAddr.street && /\d{5}/.test(next.street)) {
                setSuggestionsOpen(null);
                return;
              }
              if (next.postalCode !== data.deliveryAddr.postalCode) setSuggestionsOpen("delivery-plz");
              else if (next.street !== data.deliveryAddr.street) setSuggestionsOpen("delivery-street");
            }}
            labels={{
              company: t("addressCompany"),
              phone: t("recipientPhone"),
              street: t("addressStreet"),
              streetPlaceholder: t("addressStreetPlaceholder"),
              houseNumber: t("addressHouseNumber"),
              houseNumberPlaceholder: t("addressHouseNumberPlaceholder"),
              postalCode: t("addressPostalCode"),
              city: t("addressCity"),
              country: t("addressCountry"),
            }}
            streetSuggestions={
              suggestionsOpen === "delivery-street" &&
              (deliveryHistoryMatches.length > 0 || deliveryApiSuggestionsDeduped.length > 0) ? (
                <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#0d2137]/20 bg-white py-1 shadow-lg">
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
              ) : null
            }
            postalSuggestions={
              suggestionsOpen === "delivery-plz" && deliveryApiSuggestionsDeduped.length > 0 ? (
                <ul className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#0d2137]/20 bg-white py-1 shadow-lg">
                  {deliveryApiSuggestionsDeduped.map((s, i) => (
                    <li key={s.place_id || `api-de-plz-${i}`}>
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
                </ul>
              ) : null
            }
          />
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
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-1 ${missingFieldClass(step2Attempted, parseOrderDateInputToIso(pickupDateField).kind !== "valid")}`}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                {t("pickupTime")}
              </label>
              <input
                type="time"
                lang={htmlLang}
                required
                value={data.pickupTime}
                onChange={(e) => update({ pickupTime: e.target.value })}
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-1 ${missingFieldClass(step2Attempted, !data.pickupTime.trim())}`}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                {t("deliveryDate")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                lang={htmlLang}
                placeholder={t("deliveryDatePlaceholder")}
                value={deliveryDateField}
                disabled={!pickupScheduleReady}
                onChange={(e) => setDeliveryDateField(maskPickupDateInput(e.target.value))}
                onBlur={handleDeliveryDateBlur}
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-1 ${missingFieldClass(step2Attempted, parseOrderDateInputToIso(deliveryDateField).kind !== "valid")}`}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                {t("deliveryTime")}
              </label>
              <input
                type="time"
                lang={htmlLang}
                required
                disabled={!pickupScheduleReady}
                value={data.deliveryTime}
                onChange={(e) => update({ deliveryTime: e.target.value })}
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-1 ${missingFieldClass(step2Attempted, !data.deliveryTime.trim())}`}
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
          <div ref={loadsRef} className="rounded-lg border border-[#0d2137]/15 bg-[#0d2137]/5 p-4">
            <p className="mb-1 text-sm font-medium text-[var(--foreground)]">{t("cargoDetails")}</p>
            <p className="mb-3 text-xs text-amber-800">{t("cargoDetailsMandatoryHint")}</p>
            <div className="space-y-4">
              {loads.map((line, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border bg-white p-3 ${step3FieldWarn(!isCargoLoadLineComplete(line))}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[var(--foreground)]/70">
                      {t("loadRowLabel")} {idx + 1}
                    </p>
                    {loads.length > 1 ? (
                      <button
                        type="button"
                        className="text-xs font-medium text-red-700 hover:underline"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            loads: prev.loads.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        {t("loadRemove")}
                      </button>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t("loadQuantity")} *</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={line.quantity > 0 ? line.quantity : ""}
                        onChange={(e) =>
                          updateLoad(idx, { quantity: Math.max(0, Math.floor(Number(e.target.value) || 0)) })
                        }
                        className={`w-full rounded border px-2 py-1.5 text-sm ${missingFieldClass(step3Attempted, line.quantity < 1)}`}
                        aria-invalid={step3Attempted && line.quantity < 1}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-2 lg:col-span-2">
                      <label className="mb-1 block text-xs font-medium">{t("loadCarrier")} *</label>
                      <select
                        value={line.loadCarrier}
                        onChange={(e) =>
                          updateLoad(idx, { loadCarrier: (e.target.value || "") as LoadCarrierId | "" })
                        }
                        className={`w-full rounded border px-2 py-1.5 text-sm ${missingFieldClass(step3Attempted, !line.loadCarrier)}`}
                        aria-invalid={step3Attempted && !line.loadCarrier}
                      >
                        <option value="">,  {t("loadCarrierPlaceholder")}</option>
                        {LOAD_CARRIERS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {t(c.labelKey)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-3 lg:col-span-3">
                      <label className="mb-1 block text-xs font-medium">{t("loadContent")}</label>
                      <input
                        type="text"
                        value={line.content}
                        onChange={(e) => updateLoad(idx, { content: e.target.value })}
                        placeholder={t("loadContentPlaceholder")}
                        className="w-full rounded border border-[#0d2137]/20 px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t("cargoLengthCm")} *</label>
                      <input
                        type="number"
                        min={1}
                        value={line.lengthCm > 0 ? line.lengthCm : ""}
                        onChange={(e) => updateLoad(idx, { lengthCm: Math.max(0, Number(e.target.value) || 0) })}
                        className={`w-full rounded border px-2 py-1.5 text-sm ${missingFieldClass(step3Attempted, line.lengthCm <= 0)}`}
                        aria-invalid={step3Attempted && line.lengthCm <= 0}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t("cargoWidthCm")} *</label>
                      <input
                        type="number"
                        min={1}
                        value={line.widthCm > 0 ? line.widthCm : ""}
                        onChange={(e) => updateLoad(idx, { widthCm: Math.max(0, Number(e.target.value) || 0) })}
                        className={`w-full rounded border px-2 py-1.5 text-sm ${missingFieldClass(step3Attempted, line.widthCm <= 0)}`}
                        aria-invalid={step3Attempted && line.widthCm <= 0}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t("cargoHeightCm")} *</label>
                      <input
                        type="number"
                        min={1}
                        value={line.heightCm > 0 ? line.heightCm : ""}
                        onChange={(e) => updateLoad(idx, { heightCm: Math.max(0, Number(e.target.value) || 0) })}
                        className={`w-full rounded border px-2 py-1.5 text-sm ${missingFieldClass(step3Attempted, line.heightCm <= 0)}`}
                        aria-invalid={step3Attempted && line.heightCm <= 0}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t("loadKgPerUnit")} *</label>
                      <input
                        type="number"
                        min={1}
                        step={0.1}
                        value={line.kgPerUnit > 0 ? line.kgPerUnit : ""}
                        onChange={(e) => updateLoad(idx, { kgPerUnit: Math.max(0, Number(e.target.value) || 0) })}
                        className={`w-full rounded border px-2 py-1.5 text-sm ${missingFieldClass(step3Attempted, line.kgPerUnit <= 0)}`}
                        aria-invalid={step3Attempted && line.kgPerUnit <= 0}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t("loadStackable")}</label>
                      <select
                        value={line.stackable ? "yes" : "no"}
                        onChange={(e) => updateLoad(idx, { stackable: e.target.value === "yes" })}
                        className="w-full rounded border border-[#0d2137]/20 px-2 py-1.5 text-sm"
                      >
                        <option value="yes">{t("loadYes")}</option>
                        <option value="no">{t("loadNo")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">{t("loadDangerousGoods")}</label>
                      <select
                        value={line.dangerousGoods ? "yes" : "no"}
                        onChange={(e) => updateLoad(idx, { dangerousGoods: e.target.value === "yes" })}
                        className="w-full rounded border border-[#0d2137]/20 px-2 py-1.5 text-sm"
                      >
                        <option value="no">{t("loadNo")}</option>
                        <option value="yes">{t("loadYes")}</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-lg font-bold text-white hover:opacity-90"
              aria-label={t("loadAdd")}
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  loads: [...(prev.loads?.length ? prev.loads : [emptyCargoLoadLine()]), emptyCargoLoadLine()],
                }))
              }
            >
              +
            </button>
            <div
              ref={photosRef}
              className={`mt-4 rounded-lg p-2 ${
                step3Attempted && cargoPhotoUrls.length < 1 ? "border-2 border-red-500 bg-red-50 ring-2 ring-red-400/70" : ""
              }`}
            >
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
            <div
              className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2 text-sm font-medium text-[var(--accent)]"
              aria-live="polite"
            >
              {t("cargoL")}
            </div>
          </div>
          <div className="rounded-lg border border-[#0d2137]/15 bg-[#0d2137]/5 p-4">
            <p className="mb-2 text-sm font-medium text-[var(--foreground)]">{t("driverTimeSummary")}</p>
            {!distanceFromRoute ? (
              <p className="text-sm text-amber-700">
                {t("driverTimeRequiresAddress")}
              </p>
            ) : (
              <div className="space-y-1 text-sm font-semibold text-[var(--accent)]">
                <p>
                  {t("distanceOneWay")}: {data.distanceKm} km
                </p>
                <p>
                  {t("loadingUnloadingTime")}: {loadUnloadMinutes} {t("minutes")}
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {distanceFromRoute ? t("distanceRoute") : t("distance")} (km)
            </label>
            {distanceFromRoute ? (
              <div className="rounded-lg border border-green-200 bg-green-50/50 px-4 py-3 text-sm font-medium text-green-800">
                {data.distanceKm} km, {t("distanceFromRouteLabel")}
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
            <div className="space-y-2">
              <p className="text-sm text-[var(--foreground)]/80">{t("price")}</p>
              {priceBreakdown.assistantCents > 0 ? (
                <div className="rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-3 py-2 text-sm text-[#0d2137]">
                  <p className="font-medium">{t("loadCarrierIncludesAssistant")}</p>
                  <p className="mt-1 text-[#0d2137]/80">
                    {t("priceBreakdownAssistant")}: {formatPrice(priceBreakdown.assistantCents)}
                  </p>
                </div>
              ) : null}
              <GermanVatPriceBlock netCents={priceCents} />
            </div>
          ) : (
            <div className="rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/5 p-4 space-y-2">
              {step3Complete && pricePreviewError && (
                <p className="text-sm text-red-700">{pricePreviewError}</p>
              )}
              {step3Complete && pricePreviewLoading && (
                <p className="text-sm text-[var(--foreground)]/75">{t("pricePreviewLoading")}</p>
              )}
              {!step3Complete && step3MissingFields.length > 0 && (
                <div className="text-sm text-[var(--foreground)]/75">
                  <p className="font-medium text-amber-800">{t("priceMissingFieldsTitle")}</p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {step3MissingFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
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
            <p className="whitespace-pre-line"><strong>{t("pickup")}:</strong>{" "}{formatStructuredAddressPlain(data.pickupAddr) || pickupAddress}</p>
            <p className="whitespace-pre-line"><strong>{t("delivery")}:</strong>{" "}{formatStructuredAddressPlain(data.deliveryAddr) || deliveryAddress}</p>
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
                  : "-"}{" "}
                {data.pickupTime ? data.pickupTime : ""}
              </p>
            )}
            {(data.deliveryDate || data.deliveryTime) && (
              <p>
                <strong>
                  {t("deliveryDate")} / {t("deliveryTime")}:
                </strong>{" "}
                {data.deliveryDate
                  ? new Date(`${data.deliveryDate}T12:00:00`).toLocaleDateString(htmlLang, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "-"}{" "}
                {data.deliveryTime ? data.deliveryTime : ""}
              </p>
            )}
            {data.deliveryAddr.phone.trim() ? (
              <p>
                <strong>{t("recipientPhone")}:</strong> {data.deliveryAddr.phone}
              </p>
            ) : null}
            {loads.map((line, idx) => (
              <p key={idx}>
                <strong>
                  {t("loadRowLabel")} {idx + 1}:
                </strong>{" "}
                {line.quantity}× {line.loadCarrier ? t(`loadCarrier_${line.loadCarrier}`) : "-"}
                {line.content ? ` · ${line.content}` : ""} · {line.lengthCm}×{line.widthCm}×{line.heightCm} cm ·{" "}
                {line.kgPerUnit} kg · {t("loadStackable")}: {line.stackable ? t("loadYes") : t("loadNo")} ·{" "}
                {t("loadDangerousGoods")}: {line.dangerousGoods ? t("loadYes") : t("loadNo")}
              </p>
            ))}
            <p><strong>{t("cargoSize")}:</strong> {t("cargoL")}</p>
            <p>
              <strong>{t("cargoPhotosLabel")}:</strong> {cargoPhotoUrls.length}
            </p>
            <p><strong>{t("distance")}:</strong> {data.distanceKm} km</p>
            {priceBreakdown?.assistantCents ? (
              <p>
                <strong>{t("priceBreakdownAssistant")}:</strong> {formatPrice(priceBreakdown.assistantCents)}
              </p>
            ) : null}
            <div className="pt-2">
              <GermanVatPriceBlock netCents={priceCents} />
            </div>
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
          <OrderSuccessHandshake className="mb-1" />
          <div className="text-center">
            <p className="text-xl font-semibold text-green-800">{t("thankYouTitle")}</p>
            <p className="mt-2 text-green-700">{t("thankYouMessage")}</p>
            <p className="mt-3 text-sm text-green-700">{t("confirmByEmailHint")}</p>
          </div>
          <p className="text-center text-sm text-green-700">
            {t("orderRef")}:{" "}
            <code className="rounded bg-green-100 px-1.5 py-0.5 font-mono text-xs">
              {displayOrderRef({ order_number: orderConfirmed.orderNumber }) || "—"}
            </code>
          </p>
          <div className="border-t border-green-200 pt-5">
            <a
              href={GOOGLE_WRITE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border-2 border-[#4285F4] bg-white px-5 py-5 text-center shadow-[0_8px_24px_rgba(66,133,244,0.18)] transition hover:-translate-y-0.5 hover:border-[#1a73e8] hover:shadow-[0_12px_28px_rgba(66,133,244,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a73e8]"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-[#4285F4]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1967d2]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.5v2.9h3.8c2.3-2.1 3.6-5.2 3.6-8.5z" />
                  <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3c2 4 6.1 6.6 10.7 6.6z" />
                  <path fill="#FBBC05" d="M5.3 14.4c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7H1.3C.5 8.6 0 10.2 0 12.2s.5 3.6 1.3 5.2l4-2.9z" />
                  <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.3 2.6 1.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8z" />
                </svg>
                Google
              </span>
              <p className="text-base font-bold leading-snug text-[#0d2137]">{t("rateUsOnGoogle")}</p>
              <span className="flex items-center justify-center gap-1 text-3xl leading-none text-amber-400 drop-shadow-sm" aria-hidden>
                <span className="transition group-hover:scale-110">★★★★★</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#ea580c] px-5 py-2 text-sm font-bold text-white shadow-sm transition group-hover:bg-[#c2410c]">
                {t("rateUsOnGoogleTap")}
                <span aria-hidden>↗</span>
              </span>
            </a>
          </div>
        </div>
      )}

      {!orderConfirmed && (
        <div className="mt-8 space-y-3">
          {error && step < 4 && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-between">
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
              disabled={bookingsPaused || distanceLoading || (step === 3 && pricePreviewLoading)}
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
        </div>
      )}
    </div>
  );
}
