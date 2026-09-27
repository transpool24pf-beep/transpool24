"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { addGermanVat19, formatPrice } from "@/lib/pricing";

type Quote = { distanceKm: number; breakdown: { totalCents: number } };

const COPY: Record<string, Record<string, string>> = {
  ar: {
    title: "احجز توصيل طرد محلي", intro: "استلام وتسليم مباشر في بفورتسهايم والمنطقة.",
    name: "اسمك", email: "البريد الإلكتروني", phone: "هاتفك", recipient: "هاتف المستلم",
    pickup: "عنوان الاستلام", delivery: "عنوان التسليم", pickupTime: "موعد الاستلام", deliveryTime: "موعد التسليم",
    count: "عدد الطرود", length: "الطول (سم)", width: "العرض (سم)", height: "الارتفاع (سم)", weight: "الوزن الإجمالي (كغ)", content: "محتوى الطرد",
    quote: "احسب السعر", confirm: "تأكيد الطلب", busy: "جارٍ المعالجة…", route: "المسافة", total: "السعر شامل الضريبة",
    disclaimer: "السعر تقديري حسب المسار والوزن. الدفع متاح بعد تأكيد الطلب.", required: "يرجى إكمال الحقول المطلوبة.",
    paused: "الحجوزات متوقفة مؤقتًا.",
  },
  de: {
    title: "Lokale Paketzustellung buchen", intro: "Direkte Abholung und Zustellung in Pforzheim und Umgebung.",
    name: "Ihr Name", email: "E-Mail", phone: "Ihre Telefonnummer", recipient: "Telefon Empfänger/in",
    pickup: "Abholadresse", delivery: "Zustelladresse", pickupTime: "Abholtermin", deliveryTime: "Zustelltermin",
    count: "Anzahl Pakete", length: "Länge (cm)", width: "Breite (cm)", height: "Höhe (cm)", weight: "Gesamtgewicht (kg)", content: "Paketinhalt",
    quote: "Preis berechnen", confirm: "Auftrag bestätigen", busy: "Wird verarbeitet…", route: "Strecke", total: "Preis inkl. MwSt.",
    disclaimer: "Der Preis wird anhand von Strecke und Gewicht geschätzt. Die Zahlung folgt nach Auftragsbestätigung.", required: "Bitte füllen Sie die Pflichtfelder aus.",
    paused: "Buchungen sind vorübergehend pausiert.",
  },
  en: {
    title: "Book local parcel delivery", intro: "Direct pickup and delivery in Pforzheim and nearby areas.",
    name: "Your name", email: "Email", phone: "Your phone", recipient: "Recipient phone",
    pickup: "Pickup address", delivery: "Delivery address", pickupTime: "Pickup time", deliveryTime: "Delivery time",
    count: "Number of parcels", length: "Length (cm)", width: "Width (cm)", height: "Height (cm)", weight: "Total weight (kg)", content: "Parcel contents",
    quote: "Calculate price", confirm: "Confirm booking", busy: "Working…", route: "Distance", total: "Price including VAT",
    disclaimer: "The estimate is based on route and weight. Payment follows order confirmation.", required: "Please complete the required fields.",
    paused: "Bookings are temporarily paused.",
  },
};

export function ParcelDeliveryForm({ locale }: { locale: string }) {
  const t = useTranslations("order");
  const router = useRouter();
  const rtl = locale === "ar" || locale === "ku";
  const copy = COPY[locale] ?? (locale === "ku" ? COPY.ar : COPY.en);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [data, setData] = useState({
    name: "", email: "", phone: "", recipientPhone: "", pickup: "", delivery: "",
    pickupTime: "", deliveryTime: "", count: "1", length: "40", width: "30", height: "20", weight: "2", content: "",
  });
  const grossCents = useMemo(() => quote ? addGermanVat19(quote.breakdown.totalCents).grossCents : 0, [quote]);
  const field = (key: keyof typeof data, label: string, type = "text", required = true) => (
    <label className="block text-sm font-medium text-[#0d2137]">
      {label}{required ? " *" : ""}
      <input required={required} type={type} step={type === "number" ? key === "count" ? "1" : "any" : undefined} min={type === "number" ? key === "count" ? "1" : "0.1" : undefined}
        value={data[key]} onChange={(e) => { setData((d) => ({ ...d, [key]: e.target.value })); setQuote(null); }}
        className="mt-1 w-full rounded-lg border border-[#0d2137]/20 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/20" />
    </label>
  );

  async function requestQuote() {
    setError("");
    const form = document.getElementById("parcel-delivery-form") as HTMLFormElement;
    if (!form.reportValidity()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/order-price-preview", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupAddress: data.pickup, deliveryAddress: data.delivery, pickupTime: data.pickupTime,
          cargoSize: "XS", weightKg: Number(data.weight), cargoCategory: "carton", loadCarriers: ["carton"] }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error === "BOOKINGS_PAUSED" ? copy.paused : t("pricePreviewFailed"));
      setQuote(json as Quote);
    } catch (e) { setError(e instanceof Error ? e.message : t("pricePreviewFailed")); }
    finally { setBusy(false); }
  }

  async function confirm() {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/confirm-order", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderKind: "parcel_delivery", companyName: data.name, email: data.email, phone: data.phone,
          pickupAddress: data.pickup, deliveryAddress: data.delivery, pickupTime: data.pickupTime, deliveryTime: data.deliveryTime,
          cargoSize: "XS", cargoDetails: { parcelDelivery: true, packageCount: Number(data.count), weightKg: Number(data.weight),
            parcelDimensionsCm: { length: Number(data.length), width: Number(data.width), height: Number(data.height) },
            loads: [{ quantity: Number(data.count), loadCarrier: "carton", content: data.content, lengthCm: Number(data.length),
              widthCm: Number(data.width), heightCm: Number(data.height), kgPerUnit: Number(data.weight) / Number(data.count), stackable: true, dangerousGoods: false }],
            photoUrls: [], senderAddress: { company: data.name }, recipientAddress: { phone: data.recipientPhone } } }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error === "BOOKINGS_PAUSED" ? copy.paused : t("pricePreviewFailed"));
      router.push(`/${locale}/order/confirm?job_id=${encodeURIComponent(json.jobId)}&token=${encodeURIComponent(json.confirmationToken)}`);
    } catch (e) { setError(e instanceof Error ? e.message : t("pricePreviewFailed")); }
    finally { setBusy(false); }
  }

  return (
    <form id="parcel-delivery-form" dir={rtl ? "rtl" : "ltr"} className="rounded-2xl border border-[#0d2137]/10 bg-white p-5 shadow-sm sm:p-8" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", copy.name)}{field("email", copy.email, "email")}{field("phone", copy.phone, "tel")}{field("recipientPhone", copy.recipient, "tel")}
        {field("pickup", copy.pickup)}{field("delivery", copy.delivery)}{field("pickupTime", copy.pickupTime, "datetime-local")}{field("deliveryTime", copy.deliveryTime, "datetime-local")}
        {field("count", copy.count, "number")}{field("weight", copy.weight, "number")}{field("length", copy.length, "number")}{field("width", copy.width, "number")}{field("height", copy.height, "number")}{field("content", copy.content, "text", false)}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-[#0d2137]/60">{copy.disclaimer}</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {quote && <div className="mt-5 rounded-xl bg-[#0d2137]/5 p-4 text-sm"><p>{copy.route}: {quote.distanceKm} km</p><p className="mt-1 text-lg font-bold text-[#0d2137]">{copy.total}: {formatPrice(grossCents)}</p></div>}
      <div className="mt-5 flex flex-wrap gap-3">
        {!quote ? <button type="button" disabled={busy} onClick={requestQuote} className="rounded-lg bg-[#e85d04] px-5 py-3 font-semibold text-white disabled:opacity-60">{busy ? copy.busy : copy.quote}</button> : <button type="button" disabled={busy} onClick={confirm} className="rounded-lg bg-[#e85d04] px-5 py-3 font-semibold text-white disabled:opacity-60">{busy ? copy.busy : copy.confirm}</button>}
      </div>
    </form>
  );
}
