"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import { cargoCategoryLabelDe } from "@/lib/cargo";
import { OD_MAIL_DE, cargoCategoryAdminLabel, odT } from "@/lib/admin-order-detail-i18n";
import { serviceTypeLabel } from "@/lib/admin-ui-strings";

type Job = {
  id: string;
  order_number: number | null;
  company_name: string;
  phone: string;
  customer_email: string | null;
  pickup_address: string;
  delivery_address: string;
  cargo_size: string;
  cargo_details: Record<string, unknown> | null;
  service_type?: string;
  distance_km: number | null;
  price_cents: number;
  driver_price_cents: number | null;
  assistant_price_cents: number | null;
  payment_status: string;
  logistics_status: string;
  created_at: string;
  preferred_pickup_at: string | null;
  confirmation_token: string | null;
  assigned_driver_application_id?: string | null;
  customer_driver_rating?: number | null;
  customer_driver_comment?: string | null;
  estimated_arrival_at?: string | null;
  eta_minutes_remaining?: number | null;
  last_driver_lat?: number | null;
  last_driver_lng?: number | null;
  last_driver_location_at?: string | null;
  pod_photo_url?: string | null;
  pod_signature_url?: string | null;
  pod_confirmation_code?: string | null;
  pod_completed_at?: string | null;
  driver_tracking_token?: string | null;
};

type DriverOption = {
  id: string;
  full_name: string;
  driver_number: number | null;
  source: string;
  phone: string;
};

/** Fahrerpreis: gespeichert oder 18 ct × Hin- und Rück-km */
function getDriverPriceEur(o: Job): string {
  if (o.driver_price_cents != null) return (o.driver_price_cents / 100).toFixed(2);
  if (o.distance_km != null && o.distance_km > 0) return ((18 * o.distance_km * 2) / 100).toFixed(2);
  return "18.00";
}

/** Service type labels for WhatsApp (German only). */
function serviceTypeLabelDe(st: string | undefined): string {
  if (st === "driver_only") return "Nur Fahrer (Ihr Fahrzeug)";
  if (st === "driver_car_assistant") return "Fahrer mit Fahrzeug + Helfer";
  return "Fahrer mit Fahrzeug";
}

/** Ladungsmaße aus cargo_details */
function cargoVolumeStr(cd: Record<string, unknown> | null): string | null {
  if (!cd) return null;
  const l = cd.cargoLengthCm ?? cd.lengthCm;
  const w = cd.cargoWidthCm ?? cd.widthCm;
  const h = cd.cargoHeightCm ?? cd.heightCm;
  if (l != null && w != null && h != null) return `${l} × ${w} × ${h} cm`;
  return null;
}

const IC = {
  megaphone: "\u{1F4E2}",
  clipboard: "\u{1F4CB}",
  phone: "\u{1F4DE}",
  clock: "\u{1F556}",
  calendar: "\u{1F4C5}",
  ruler: "\u{1F4CF}",
  truck: "\u{1F69A}",
  package: "\u{1F4E6}",
  scale: "\u2696\uFE0F",
  lorry: "\u{1F69B}",
  building: "\u{1F3E2}",
  pin: "\u{1F4CD}",
  money: "\u{1F4B0}",
  worker: "\u{1F477}",
};

/** WhatsApp message for driver group — German only. */
function buildWhatsAppMessage(o: Job): string {
  const orderRef = o.order_number != null ? String(o.order_number) : o.id;
  const driverEur = getDriverPriceEur(o);
  const assistantCents = o.assistant_price_cents ?? 1630;
  const assistantEur = (assistantCents / 100).toFixed(2);
  const hasAssistant = o.service_type === "driver_car_assistant";
  const timeStr = o.preferred_pickup_at
    ? new Date(o.preferred_pickup_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : null;
  const dateStr = o.preferred_pickup_at
    ? new Date(o.preferred_pickup_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : null;
  const weightKg = o.cargo_details && typeof o.cargo_details.weightKg === "number"
    ? o.cargo_details.weightKg
    : o.cargo_details && typeof (o.cargo_details as { cargoWeightKg?: number }).cargoWeightKg === "number"
      ? (o.cargo_details as { cargoWeightKg: number }).cargoWeightKg
      : null;
  const packageCount =
    o.cargo_details && typeof (o.cargo_details as { packageCount?: unknown }).packageCount === "number"
      ? (o.cargo_details as { packageCount: number }).packageCount
      : null;
  const photoUrls =
    o.cargo_details && Array.isArray((o.cargo_details as { photoUrls?: unknown }).photoUrls)
      ? ((o.cargo_details as { photoUrls: string[] }).photoUrls).filter((u) => typeof u === "string")
      : [];
  const distanceStr = o.distance_km != null ? `${o.distance_km} km` : "—";
  const volumeStr = cargoVolumeStr(o.cargo_details);
  const serviceLabel = serviceTypeLabelDe(o.service_type);
  const blocks: string[] = [
    `${IC.megaphone} TransPool24 – Transportauftrag`,
    "",
    `${IC.clipboard} Auftragsnummer: ${orderRef}`,
    "",
    `${IC.phone} Telefon: ${o.phone}`,
    "",
    ...(timeStr ? [`${IC.clock} Zeit (Ankunft am Kunden): ${timeStr}`] : []),
    ...(dateStr ? [`${IC.calendar} Datum: ${dateStr}`] : []),
    ...(timeStr || dateStr ? [""] : []),
    `${IC.ruler} Distanz: ${distanceStr}`,
    "",
    `${IC.truck} Ladung (Größe): ${o.cargo_size}`,
    ...(typeof (o.cargo_details as { cargoCategory?: unknown } | null)?.cargoCategory === "string" &&
    String((o.cargo_details as { cargoCategory: string }).cargoCategory).length > 0
      ? [`${IC.clipboard} Warenkategorie: ${cargoCategoryLabelDe((o.cargo_details as { cargoCategory: string }).cargoCategory)}`]
      : []),
    ...(volumeStr ? [`${IC.package} Maße (L×B×H): ${volumeStr}`] : []),
    ...(weightKg != null ? [`${IC.scale} Gewicht: ${weightKg} kg`] : []),
    ...(packageCount != null ? [`${IC.package} Pakete/Stück: ${packageCount}`] : []),
    ...(photoUrls.length > 0 ? [`📷 Fotos: ${photoUrls.length}`] : []),
    `${IC.lorry} Leistung: ${serviceLabel}`,
    `${IC.building} Firma: ${o.company_name}`,
    "",
    `${IC.pin} Abholung:`,
    o.pickup_address,
    "",
    `${IC.pin} Zustellung:`,
    o.delivery_address,
    "",
    `${IC.money} Fahrerpreis (Gruppe): ${driverEur} EUR`,
    ...(hasAssistant ? [`${IC.worker} Helfer (Gruppe): ${assistantEur} EUR`] : []),
  ];
  return blocks.join("\n");
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { locale } = useAdminLocale();
  const dateLoc = locale === "ar" ? "ar-SA" : "de-DE";
  const [order, setOrder] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingTrackOnly, setSendingTrackOnly] = useState(false);
  const [sendingDeliveryConfirm, setSendingDeliveryConfirm] = useState(false);
  const [attachPodToEmail, setAttachPodToEmail] = useState(true);
  const [thankYouFile, setThankYouFile] = useState<File | null>(null);
  const [thankYouPreview, setThankYouPreview] = useState<string | null>(null);
  const [sendingThankYou, setSendingThankYou] = useState(false);
  const thankYouFileInputRef = useRef<HTMLInputElement>(null);
  const [ensuringDriverLink, setEnsuringDriverLink] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [updatingDriver, setUpdatingDriver] = useState(false);
  const [savingTrack, setSavingTrack] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [etaLocal, setEtaLocal] = useState("");
  const [etaMin, setEtaMin] = useState("");
  const [podPhoto, setPodPhoto] = useState("");
  const [podSig, setPodSig] = useState("");
  const [podCode, setPodCode] = useState("");
  const [latIn, setLatIn] = useState("");
  const [lngIn, setLngIn] = useState("");

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetch(`/api/admin/orders/${p.id}`)
        .then((r) => r.json())
        .then((data) => {
          setOrder(data);
        })
        .catch(() => setOrder(null))
        .finally(() => setLoading(false));
    });
  }, [params]);

  useEffect(() => {
    fetch("/api/admin/drivers")
      .then((r) => r.json())
      .then(
        (list: { id: string; full_name: string; driver_number: number | null; source: string; phone?: string | null }[]) => {
          const fromApps = (list ?? []).filter((d) => d.source === "application" && d.driver_number != null);
          setDrivers(
            fromApps.map((d) => ({
              id: d.id,
              full_name: d.full_name,
              driver_number: d.driver_number,
              source: d.source,
              phone: (d.phone ?? "").trim(),
            }))
          );
        }
      )
      .catch(() => setDrivers([]));
  }, []);

  useEffect(() => {
    if (!order) return;
    if (order.estimated_arrival_at) {
      const d = new Date(order.estimated_arrival_at);
      const pad = (n: number) => String(n).padStart(2, "0");
      setEtaLocal(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      );
    } else setEtaLocal("");
    setEtaMin(order.eta_minutes_remaining != null ? String(order.eta_minutes_remaining) : "");
    setPodPhoto(order.pod_photo_url ?? "");
    setPodSig(order.pod_signature_url ?? "");
    setPodCode(order.pod_confirmation_code ?? "");
    setLatIn(order.last_driver_lat != null ? String(order.last_driver_lat) : "");
    setLngIn(order.last_driver_lng != null ? String(order.last_driver_lng) : "");
    setAttachPodToEmail(Boolean(order.pod_photo_url?.trim()));
  }, [order]);

  const lastThankYouOrderIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!order?.id) return;
    if (lastThankYouOrderIdRef.current === order.id) return;
    lastThankYouOrderIdRef.current = order.id;
    setThankYouFile(null);
    setThankYouPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (thankYouFileInputRef.current) thankYouFileInputRef.current.value = "";
  }, [order?.id]);

  useEffect(() => {
    return () => {
      if (thankYouPreview) URL.revokeObjectURL(thankYouPreview);
    };
  }, [thankYouPreview]);

  const assignDriver = (driverApplicationId: string | null) => {
    if (!order) return;
    setUpdatingDriver(true);
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, assigned_driver_application_id: driverApplicationId || null }),
    })
      .then((r) => r.json())
      .then((data) => {
        setOrder((prev) => (prev ? { ...prev, assigned_driver_application_id: data.assigned_driver_application_id ?? driverApplicationId } : null));
      })
      .catch(() => {})
      .finally(() => setUpdatingDriver(false));
  };

  const saveAssistantPriceEur = (eurValue: string) => {
    if (!order || order.service_type !== "driver_car_assistant") return;
    const trimmed = eurValue.trim();
    const cents = trimmed === "" ? null : Math.round(parseFloat(trimmed.replace(",", ".")) * 100);
    if (cents !== null && (Number.isNaN(cents) || cents < 0)) return;
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, assistant_price_cents: cents }),
    })
      .then(async (r) => {
        const data = (await r.json()) as Job & { error?: string };
        if (!r.ok) throw new Error(typeof data.error === "string" ? data.error : odT(locale, "od.errSave"));
        return data as Job;
      })
      .then((data) => {
        setOrder((prev) => (prev ? { ...prev, assistant_price_cents: data.assistant_price_cents ?? cents } : null));
      })
      .catch((e) => alert(e instanceof Error ? e.message : odT(locale, "od.errGeneric")));
  };

  const sendEmailToCustomer = () => {
    if (!order?.customer_email) return;
    if (!order.assigned_driver_application_id) {
      alert(OD_MAIL_DE.alertPickDriverFirst);
      return;
    }
    setSending(true);
    fetch("/api/admin/send-order-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: order.id }),
    })
      .then((r) => {
        if (r.ok) alert(OD_MAIL_DE.alertEmailSent + order.customer_email);
        else
          r.json().then((d) => {
            const errMsg =
              typeof d?.error === "string"
                ? d.error
                : (d?.error && typeof d.error === "object" && "message" in d.error)
                  ? String((d.error as { message: unknown }).message)
                  : OD_MAIL_DE.alertSendFailed;
            alert(errMsg);
          });
      })
      .catch(() => alert(OD_MAIL_DE.alertRequestFailed))
      .finally(() => setSending(false));
  };

  const sendTrackingOnlyEmail = () => {
    if (!order?.customer_email) return;
    if (!order.confirmation_token) {
      alert(OD_MAIL_DE.alertNoToken);
      return;
    }
    setSendingTrackOnly(true);
    fetch("/api/admin/send-tracking-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: order.id }),
    })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : OD_MAIL_DE.alertSendFailed);
        return j;
      })
      .then(() => {
        alert(OD_MAIL_DE.alertTrackingSent + order.customer_email);
      })
      .catch((e) => alert(e instanceof Error ? e.message : OD_MAIL_DE.alertSendFailed))
      .finally(() => setSendingTrackOnly(false));
  };

  const openWhatsApp = () => {
    if (!order) return;
    const text = buildWhatsAppMessage(order);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const openWhatsAppCustomer = () => {
    if (!order?.phone) return;
    const digits = order.phone.replace(/\D/g, "");
    if (!digits) return;
    window.open(`https://wa.me/${digits}`, "_blank", "noopener");
  };

  /** Google Maps links + GPS share page — WhatsApp text German only. */
  const openWhatsAppDriverNavLinks = async () => {
    if (!order) return;
    if (!order.assigned_driver_application_id) {
      alert(odT(locale, "od.alertPickDriverWa"));
      return;
    }
    const driverRow = drivers.find((d) => d.id === order.assigned_driver_application_id);
    if (!driverRow?.phone) {
      alert(odT(locale, "od.alertNoDriverPhone"));
      return;
    }
    const digits = driverRow.phone.replace(/\D/g, "");
    if (!digits) {
      alert(odT(locale, "od.alertBadWa"));
      return;
    }
    const pickupUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.pickup_address)}&travelmode=driving`;
    const orderRef = order.order_number != null ? String(order.order_number) : order.id.slice(0, 8);
    const distStr = order.distance_km != null ? `${order.distance_km} km` : "—";

    let driverTrackUrl: string | null = null;
    try {
      const r = await fetch(`/api/admin/orders/${order.id}/driver-share-link`, { method: "POST" });
      const j = (await r.json()) as { url?: string };
      if (r.ok && j.url) {
        driverTrackUrl = j.url;
        const full = await fetch(`/api/admin/orders/${order.id}`).then((x) => x.json());
        setOrder(full as Job);
      }
    } catch {
      /* Tracking link optional */
    }

    const customerLines = [
      "👤 Kunde / Kontakt:",
      `Firma: ${order.company_name || "—"}`,
      `Telefon: ${order.phone || "—"}`,
      ...(order.customer_email?.trim() ? [`E-Mail: ${order.customer_email.trim()}`] : []),
      "",
      `Abholung: ${order.pickup_address}`,
      `Zustellung: ${order.delivery_address}`,
      "",
    ];

    const trackingBlock = driverTrackUrl
      ? [
          "📲 Sendungsverfolgung (während der Fahrt verfügbar – der Kunde sieht die Sendung auf dem Weg zur Zustellung):",
          driverTrackUrl,
          "",
        ]
      : [
          "📲 Sendungsverfolgung: Link nicht erzeugt – in der Auftragsmaske „Fahrer-GPS-Link kopieren“ nutzen.",
          "",
        ];

    const text = [
      "🚚 TransPool24 – Auftrag #" + orderRef,
      "",
      ...customerLines,
      "📍 1) Zum Abholort (ein Tippen):",
      pickupUrl,
      "",
      ...trackingBlock,
      "📏 Distanz (ca.): " + distStr,
      "",
      "Viel Erfolg!",
    ].join("\n");

    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const downloadInvoice = (type: "customer" | "driver") => {
    if (!order) return;
    window.open(`/api/admin/invoice?job_id=${encodeURIComponent(order.id)}&type=${type}`, "_blank");
  };

  const copyTrackingLink = () => {
    if (!order?.confirmation_token) {
      alert(odT(locale, "od.alertNoTokenTrack"));
      return;
    }
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${base}/de/order/track?job_id=${encodeURIComponent(order.id)}&token=${encodeURIComponent(order.confirmation_token)}`;
    void navigator.clipboard.writeText(url).then(
      () => alert(odT(locale, "od.alertTrackCopy") + url),
      () => {
        prompt(odT(locale, "od.promptCopy"), url);
      }
    );
  };

  /** Erzeugt driver_tracking_token in der DB falls nötig (SQL: add_driver_tracking_token.sql / roadmap_foundation.sql) */
  const copyDriverGpsShareLink = () => {
    if (!order) return;
    setEnsuringDriverLink(true);
    fetch(`/api/admin/orders/${order.id}/driver-share-link`, { method: "POST" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) {
          const hint = typeof j.hint === "string" ? `\n\n${j.hint}` : "";
          throw new Error((typeof j.error === "string" ? j.error : odT(locale, "od.errGeneric")) + hint);
        }
        return j as { url: string };
      })
      .then(({ url }) => {
        return navigator.clipboard.writeText(url).then(
          () => ({ url, ok: true as const }),
          () => ({ url, ok: false as const })
        );
      })
      .then(({ url, ok }) => {
        if (ok) alert(odT(locale, "od.alertGpsCopied") + url);
        else prompt(odT(locale, "od.promptCopy"), url);
        return fetch(`/api/admin/orders/${order.id}`).then((r) => r.json());
      })
      .then((data: Job) => setOrder(data))
      .catch((e) => alert(e instanceof Error ? e.message : odT(locale, "od.errGeneric")))
      .finally(() => setEnsuringDriverLink(false));
  };

  const saveTrackingAndPod = () => {
    if (!order) return;
    setSavingTrack(true);
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: order.id,
        estimated_arrival_at: etaLocal ? new Date(etaLocal).toISOString() : null,
        eta_minutes_remaining: etaMin === "" ? null : Number(etaMin),
        pod_photo_url: podPhoto.trim() || null,
        pod_signature_url: podSig.trim() || null,
        pod_confirmation_code: podCode.trim() || null,
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(typeof data.error === "string" ? data.error : odT(locale, "od.errSave"));
        return data as Job;
      })
      .then((data) => {
        setOrder((prev) => (prev ? { ...prev, ...data } : null));
        alert(odT(locale, "od.alertEtaSaved"));
      })
      .catch((e) => alert(e instanceof Error ? e.message : odT(locale, "od.errSave")))
      .finally(() => setSavingTrack(false));
  };

  const markPodCompletedNow = () => {
    if (!order) return;
    if (!window.confirm(odT(locale, "od.confirmPodDone"))) return;
    setSavingTrack(true);
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: order.id,
        pod_completed_at: new Date().toISOString(),
        logistics_status: "delivered",
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(typeof data.error === "string" ? data.error : odT(locale, "od.errGeneric"));
        return data as Job;
      })
      .then((data) => {
        setOrder((prev) => (prev ? { ...prev, ...data } : null));
        alert(odT(locale, "od.alertPodDone"));
      })
      .catch((e) => alert(e instanceof Error ? e.message : odT(locale, "od.errGeneric")))
      .finally(() => setSavingTrack(false));
  };

  const submitDriverGps = () => {
    if (!order) return;
    const lat = parseFloat(latIn.replace(",", "."));
    const lng = parseFloat(lngIn.replace(",", "."));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      alert(odT(locale, "od.alertGpsInvalid"));
      return;
    }
    setSavingLocation(true);
    fetch(`/api/admin/orders/${order.id}/driver-location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : odT(locale, "od.errSave"));
        return j as { recorded_at?: string };
      })
      .then((j) => {
        const now = j.recorded_at ?? new Date().toISOString();
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                last_driver_lat: lat,
                last_driver_lng: lng,
                last_driver_location_at: now,
              }
            : null
        );
        alert(odT(locale, "od.alertGpsSaved"));
      })
      .catch((e) => alert(e instanceof Error ? e.message : odT(locale, "od.errGeneric")))
      .finally(() => setSavingLocation(false));
  };

  if (loading || !id) {
    return (
      <div className="rounded-2xl bg-white p-10 shadow-lg">
        <p className="text-[#0d2137]/70">{odT(locale, "od.loading")}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{odT(locale, "od.notFound")}</p>
        <Link href="/admin/orders" className="text-[var(--accent)] hover:underline">
          {odT(locale, "od.backList")}
        </Link>
      </div>
    );
  }

  const driverPriceEur = getDriverPriceEur(order);
  const customerPriceEur = (order.price_cents / 100).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#0d2137]">{odT(locale, "od.title")}</h1>
        <Link
          href="/admin/orders"
          className="rounded-xl border-2 border-[#0d2137]/20 bg-white px-4 py-2 text-sm font-medium text-[#0d2137] hover:bg-[#0d2137]/5"
        >
          {odT(locale, "od.backList")}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">{odT(locale, "od.dataTitle")}</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[#0d2137]/60">{odT(locale, "od.orderNumber")}</dt>
              <dd className="font-mono font-semibold text-[#0d2137]">{order.order_number ?? order.id}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">{odT(locale, "od.created")}</dt>
              <dd>{new Date(order.created_at).toLocaleDateString(dateLoc)}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">{odT(locale, "od.paymentCustomer")}</dt>
              <dd className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    order.payment_status === "paid"
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900"
                      : order.payment_status === "pending"
                        ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900"
                        : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800"
                  }
                >
                  {order.payment_status === "paid"
                    ? odT(locale, "od.paymentPaid")
                    : order.payment_status === "pending"
                      ? odT(locale, "od.paymentPending")
                      : order.payment_status === "refunded"
                        ? odT(locale, "od.paymentRefunded")
                        : order.payment_status === "failed"
                          ? odT(locale, "od.paymentFailed")
                          : order.payment_status}
                </span>
                {order.payment_status !== "paid" ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!order || !window.confirm(OD_MAIL_DE.markPaidConfirm)) return;
                      fetch("/api/admin/orders", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: order.id, payment_status: "paid" }),
                      })
                        .then(async (r) => {
                          const data = await r.json();
                          if (!r.ok) throw new Error(typeof data.error === "string" ? data.error : odT(locale, "od.errGeneric"));
                          return data as Job;
                        })
                        .then((data) => setOrder((prev) => (prev ? { ...prev, ...data } : null)))
                        .then(() => alert(OD_MAIL_DE.markPaidAlert))
                        .catch((e) => alert(e instanceof Error ? e.message : odT(locale, "od.errGeneric")));
                    }}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    {OD_MAIL_DE.markPaidBtn}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!order || !window.confirm(OD_MAIL_DE.markPendingConfirm)) return;
                      fetch("/api/admin/orders", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: order.id, payment_status: "pending" }),
                      })
                        .then(async (r) => {
                          const data = await r.json();
                          if (!r.ok) throw new Error(typeof data.error === "string" ? data.error : odT(locale, "od.errGeneric"));
                          return data as Job;
                        })
                        .then((data) => setOrder((prev) => (prev ? { ...prev, ...data } : null)))
                        .catch((e) => alert(e instanceof Error ? e.message : odT(locale, "od.errGeneric")));
                    }}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                  >
                    {OD_MAIL_DE.markPendingBtn}
                  </button>
                )}
              </dd>
            </div>
            {order.preferred_pickup_at && (
              <div>
                <dt className="text-[#0d2137]/60">{odT(locale, "od.pickupTime")}</dt>
                <dd className="font-medium text-[#0d2137]">
                  {new Date(order.preferred_pickup_at).toLocaleString(dateLoc, { dateStyle: "short", timeStyle: "short" })}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-[#0d2137]/60">{odT(locale, "od.company")}</dt>
              <dd>{order.company_name}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">{odT(locale, "od.phone")}</dt>
              <dd>{order.phone}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">{odT(locale, "od.emailCustomer")}</dt>
              <dd>{order.customer_email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">{odT(locale, "od.pickup")}</dt>
              <dd>{order.pickup_address}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">{odT(locale, "od.delivery")}</dt>
              <dd>{order.delivery_address}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">{odT(locale, "od.cargoSize")}</dt>
              <dd>{order.cargo_size}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">{odT(locale, "od.serviceType")}</dt>
              <dd>{serviceTypeLabel(locale, order.service_type)}</dd>
            </div>
            {order.cargo_details &&
              typeof (order.cargo_details as { cargoCategory?: unknown }).cargoCategory === "string" &&
              String((order.cargo_details as { cargoCategory: string }).cargoCategory).length > 0 && (
                <div>
                  <dt className="text-[#0d2137]/60">{odT(locale, "od.cargoCategory")}</dt>
                  <dd>
                    {cargoCategoryAdminLabel(locale, (order.cargo_details as { cargoCategory: string }).cargoCategory)}
                  </dd>
                </div>
              )}
            {(order.cargo_details && (typeof (order.cargo_details as { weightKg?: number }).weightKg === "number" || typeof (order.cargo_details as { cargoWeightKg?: number }).cargoWeightKg === "number")) && (
              <div>
                <dt className="text-[#0d2137]/60">{odT(locale, "od.weight")}</dt>
                <dd>{(order.cargo_details as { weightKg?: number; cargoWeightKg?: number }).weightKg ?? (order.cargo_details as { cargoWeightKg?: number }).cargoWeightKg} kg</dd>
              </div>
            )}
            {order.cargo_details && typeof (order.cargo_details as { packageCount?: unknown }).packageCount === "number" && (
              <div>
                <dt className="text-[#0d2137]/60">{odT(locale, "od.packages")}</dt>
                <dd>{(order.cargo_details as { packageCount: number }).packageCount}</dd>
              </div>
            )}
            {order.cargo_details &&
              typeof (order.cargo_details as { weightSurchargeCents?: unknown }).weightSurchargeCents === "number" &&
              (order.cargo_details as { weightSurchargeCents: number }).weightSurchargeCents > 0 && (
                <div>
                  <dt className="text-[#0d2137]/60">{odT(locale, "od.weightSurcharge")}</dt>
                  <dd>
                    +{((order.cargo_details as { weightSurchargeCents: number }).weightSurchargeCents / 100).toFixed(2)} €
                  </dd>
                </div>
              )}
            {order.cargo_details &&
              typeof (order.cargo_details as { cargoCategorySurchargeCents?: unknown }).cargoCategorySurchargeCents ===
                "number" &&
              (order.cargo_details as { cargoCategorySurchargeCents: number }).cargoCategorySurchargeCents > 0 && (
                <div>
                  <dt className="text-[#0d2137]/60">{odT(locale, "od.categorySurcharge")}</dt>
                  <dd>
                    +
                    {(
                      (order.cargo_details as { cargoCategorySurchargeCents: number }).cargoCategorySurchargeCents / 100
                    ).toFixed(2)}{" "}
                    €
                  </dd>
                </div>
              )}
            {order.cargo_details &&
              typeof (order.cargo_details as { routeTerrain?: unknown }).routeTerrain === "string" &&
              String((order.cargo_details as { routeTerrain: string }).routeTerrain).length > 0 && (
                <div>
                  <dt className="text-[#0d2137]/60">{odT(locale, "od.terrain")}</dt>
                  <dd>
                    {(order.cargo_details as { routeTerrain: string }).routeTerrain}
                    {typeof (order.cargo_details as { routeWeather?: string }).routeWeather === "string" &&
                    (order.cargo_details as { routeWeather: string }).routeWeather
                      ? ` · ${(order.cargo_details as { routeWeather: string }).routeWeather}`
                      : ""}
                    {typeof (order.cargo_details as { routeDriveTimeMultiplier?: number }).routeDriveTimeMultiplier ===
                    "number"
                      ? `${odT(locale, "od.routeFactor")}${(order.cargo_details as { routeDriveTimeMultiplier: number }).routeDriveTimeMultiplier.toFixed(2)}`
                      : ""}
                    {typeof (order.cargo_details as { terrainSource?: string }).terrainSource === "string" &&
                    (order.cargo_details as { terrainSource: string }).terrainSource
                      ? `${odT(locale, "od.routeTerrainLbl")}${(order.cargo_details as { terrainSource: string }).terrainSource}`
                      : ""}
                    {typeof (order.cargo_details as { weatherSource?: string }).weatherSource === "string" &&
                    (order.cargo_details as { weatherSource: string }).weatherSource
                      ? `${odT(locale, "od.routeWeatherSrcLbl")}${(order.cargo_details as { weatherSource: string }).weatherSource}`
                      : ""}
                  </dd>
                </div>
              )}
            {order.cargo_details &&
              Array.isArray((order.cargo_details as { photoUrls?: unknown }).photoUrls) &&
              (order.cargo_details as { photoUrls: string[] }).photoUrls.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-[#0d2137]/60">{odT(locale, "od.cargoPhotos")}</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {(order.cargo_details as { photoUrls: string[] }).photoUrls.map((url, i) => (
                      <a
                        key={url + i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-lg border border-[#0d2137]/15"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-24 w-24 object-cover hover:opacity-90" />
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            <div>
              <dt className="text-[#0d2137]/60">{odT(locale, "od.distance")}</dt>
              <dd>{order.distance_km != null ? `${order.distance_km} km` : "—"}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">{odT(locale, "od.priceCustomer")}</dt>
              <dd className="font-semibold text-[#0d2137]">€ {customerPriceEur}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">{odT(locale, "od.priceDriverGroup")}</dt>
              <dd className="font-semibold text-amber-700">€ {driverPriceEur}</dd>
            </div>
            {order.service_type === "driver_car_assistant" && (
              <div>
                <dt className="text-[#0d2137]/60">{odT(locale, "od.priceAssistant")}</dt>
                <dd>
                  <input
                    type="text"
                    key={`detail-asst-${order.assistant_price_cents ?? "null"}`}
                    defaultValue={
                      order.assistant_price_cents != null
                        ? (order.assistant_price_cents / 100).toFixed(2).replace(".", ",")
                        : "16,30"
                    }
                    onBlur={(e) => saveAssistantPriceEur(e.target.value)}
                    className="w-28 rounded-lg border-2 border-violet-200 bg-violet-50/50 px-2 py-1.5 text-sm font-semibold text-violet-900"
                    title={odT(locale, "od.assistantInputTitle")}
                  />
                  <span className="ml-2 text-xs text-[#0d2137]/50">{odT(locale, "od.assistantSaveHint")}</span>
                </dd>
              </div>
            )}
            {(order.customer_driver_rating != null || order.customer_driver_comment) && (
              <div>
                <dt className="text-[#0d2137]/60">{odT(locale, "od.ratingTitle")}</dt>
                <dd className="rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] p-2 text-sm">
                  {order.customer_driver_rating != null && (
                    <span className="text-amber-600 font-medium">
                      ★ {order.customer_driver_rating} {odT(locale, "od.stars")}
                    </span>
                  )}
                  {order.customer_driver_comment && (
                    <p className="mt-1 text-[#0d2137]/80">«{order.customer_driver_comment}»</p>
                  )}
                </dd>
              </div>
            )}
            <div>
              <dt className="mb-1.5 text-[#0d2137]/60">{odT(locale, "od.driverApplication")}</dt>
              <dd>
                <select
                  value={order.assigned_driver_application_id ?? ""}
                  onChange={(e) => assignDriver(e.target.value || null)}
                  disabled={updatingDriver}
                  className="w-full max-w-xs rounded-lg border-2 border-[#0d2137]/20 bg-white px-3 py-2 text-sm font-medium text-[#0d2137] focus:border-[var(--accent)] focus:outline-none disabled:opacity-60"
                >
                  <option value="">{odT(locale, "od.noDriver")}</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.driver_number != null ? `#${String(d.driver_number)} – ${d.full_name}` : d.full_name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[#0d2137]/50">{odT(locale, "od.driverHintBeforeEmail")}</p>
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">{odT(locale, "od.actionsColumn")}</h2>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={openWhatsApp}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 font-medium text-white shadow-sm hover:bg-[#20bd5a]"
            >
              {odT(locale, "od.waGroup")}
            </button>
            <button
              type="button"
              onClick={openWhatsAppCustomer}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#25D366] bg-[#25D366]/10 px-4 py-3 font-medium text-[#25D366] hover:bg-[#25D366]/20"
            >
              {odT(locale, "od.waCustomer")} ({order.phone})
            </button>
            <button
              type="button"
              onClick={() => void openWhatsAppDriverNavLinks()}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-emerald-700 bg-emerald-700 px-4 py-3 text-center font-medium text-white shadow-sm hover:bg-emerald-800"
            >
              <span>{odT(locale, "od.waDriver")}</span>
              <span className="text-xs font-normal opacity-90">{odT(locale, "od.waDriverSub")}</span>
            </button>
            {order.customer_email && (
              <>
                <p className="text-xs font-semibold text-[#0d2137]/80">{OD_MAIL_DE.sectionEmailPdf}</p>
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-3">
                  <label className="mb-1.5 block text-sm font-medium text-amber-900">{OD_MAIL_DE.driverPickEmail}</label>
                  <select
                    value={order.assigned_driver_application_id ?? ""}
                    onChange={(e) => assignDriver(e.target.value || null)}
                    disabled={updatingDriver}
                    className="w-full rounded-lg border-2 border-amber-300 bg-white px-3 py-2 text-sm font-medium text-[#0d2137] focus:border-[var(--accent)] focus:outline-none disabled:opacity-60"
                  >
                    <option value="">{OD_MAIL_DE.driverPickPlaceholder}</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.driver_number != null ? `#${String(d.driver_number)} – ${d.full_name}` : d.full_name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-amber-800/80">{OD_MAIL_DE.driverInEmailHint}</p>
                </div>
                <button
                  type="button"
                  onClick={sendEmailToCustomer}
                  disabled={sending || !order.assigned_driver_application_id}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? OD_MAIL_DE.confirmEmailSending : OD_MAIL_DE.confirmEmailBtn}
                </button>
                <button
                  type="button"
                  onClick={sendTrackingOnlyEmail}
                  disabled={sendingTrackOnly}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#0d2137] bg-[#0d2137] px-4 py-3 font-medium text-white shadow-sm hover:bg-[#0d2137]/90 disabled:opacity-60"
                >
                  {sendingTrackOnly ? OD_MAIL_DE.trackingEmailSending : OD_MAIL_DE.trackingEmailBtn}
                </button>
                <p className="text-xs text-[#0d2137]/65">{OD_MAIL_DE.trackingEmailHint}</p>
                <div className="rounded-xl border-2 border-teal-200 bg-teal-50/50 p-3">
                  <p className="text-sm font-semibold text-teal-950">{odT(locale, "od.thankYouBlockTitle")}</p>
                  <p className="mt-1 text-xs text-[#0d2137]/75">{odT(locale, "od.thankYouBlockDesc")}</p>
                  <input
                    ref={thankYouFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="mt-2 block w-full text-sm text-[#0d2137] file:me-2 file:rounded-lg file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setThankYouPreview((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return f ? URL.createObjectURL(f) : null;
                      });
                      setThankYouFile(f);
                    }}
                  />
                  {thankYouPreview ? (
                    <div className="mt-2 overflow-hidden rounded-lg border border-teal-200 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thankYouPreview} alt="" className="max-h-52 w-full object-contain" />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    disabled={sendingThankYou || !thankYouFile || !order.customer_email?.trim()}
                    onClick={async () => {
                      if (!thankYouFile) {
                        alert(odT(locale, "od.thankYouNoFile"));
                        return;
                      }
                      setSendingThankYou(true);
                      try {
                        const fd = new FormData();
                        fd.append("file", thankYouFile);
                        const res = await fetch(`/api/admin/orders/${order.id}/send-thankyou-delivery`, {
                          method: "POST",
                          body: fd,
                        });
                        const data = (await res.json()) as { error?: string; sentTo?: string };
                        if (!res.ok) {
                          alert(data?.error ?? odT(locale, "od.thankYouFail"));
                          return;
                        }
                        alert(odT(locale, "od.thankYouSent") + (data.sentTo ?? order.customer_email));
                        setThankYouFile(null);
                        setThankYouPreview((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return null;
                        });
                        if (thankYouFileInputRef.current) thankYouFileInputRef.current.value = "";
                      } catch {
                        alert(OD_MAIL_DE.alertNetwork);
                      } finally {
                        setSendingThankYou(false);
                      }
                    }}
                    className="mt-3 w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingThankYou ? odT(locale, "od.thankYouSending") : odT(locale, "od.thankYouSendBtn")}
                  </button>
                </div>
              </>
            )}
            <hr className="border-[#0d2137]/10" />
            <p className="text-sm font-medium text-[#0d2137]">{OD_MAIL_DE.invoicesTitle}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadInvoice("customer")}
                className="rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-100"
              >
                {OD_MAIL_DE.invoiceCustomer(customerPriceEur)}
              </button>
              <button
                type="button"
                onClick={() => downloadInvoice("driver")}
                className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
              >
                {OD_MAIL_DE.invoiceDriver(driverPriceEur)}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold text-[#0d2137]">{odT(locale, "od.trackingTitle")}</h2>
        <p className="mb-4 text-sm text-[#0d2137]/65">{odT(locale, "od.trackingIntro")}</p>
        <div className="flex flex-wrap gap-2 border-b border-[#0d2137]/10 pb-4">
          <button
            type="button"
            onClick={copyTrackingLink}
            className="rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[#0d2137] hover:bg-[var(--accent)]/20"
          >
            {odT(locale, "od.copyTrackLink")}
          </button>
          <button
            type="button"
            onClick={copyDriverGpsShareLink}
            disabled={ensuringDriverLink}
            className="rounded-xl border-2 border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
          >
            {ensuringDriverLink ? odT(locale, "od.copyGpsWorking") : odT(locale, "od.copyGpsLink")}
          </button>
          {order.driver_tracking_token && (
            <span className="self-center text-xs text-emerald-800/80">{odT(locale, "od.tokenActive")}</span>
          )}
          {order.last_driver_lat != null && order.last_driver_lng != null && (
            <span className="self-center text-xs text-[#0d2137]/60">
              {odT(locale, "od.lastPos")} {order.last_driver_lat.toFixed(5)}, {order.last_driver_lng.toFixed(5)}
              {order.last_driver_location_at
                ? ` — ${new Date(order.last_driver_location_at).toLocaleString(dateLoc)}`
                : ""}
            </span>
          )}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#0d2137]">{odT(locale, "od.etaTitle")}</p>
            <label className="block text-xs text-[#0d2137]/60">{odT(locale, "od.etaDate")}</label>
            <input
              type="datetime-local"
              value={etaLocal}
              onChange={(e) => setEtaLocal(e.target.value)}
              className="w-full max-w-md rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
            <label className="block text-xs text-[#0d2137]/60">{odT(locale, "od.etaMinutes")}</label>
            <input
              type="number"
              min={0}
              value={etaMin}
              onChange={(e) => setEtaMin(e.target.value)}
              placeholder={odT(locale, "od.etaPlaceholder")}
              className="w-full max-w-xs rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#0d2137]">{odT(locale, "od.podTitle")}</p>
            {order.pod_photo_url ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-emerald-800">{odT(locale, "od.podPhotoLabel")}</p>
                <a
                  href={order.pod_photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block max-w-full overflow-hidden rounded-lg border-2 border-emerald-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.pod_photo_url}
                    alt={odT(locale, "od.podPhotoAlt")}
                    className="max-h-48 w-auto max-w-full object-contain"
                  />
                </a>
              </div>
            ) : null}
            <input
              value={podPhoto}
              onChange={(e) => setPodPhoto(e.target.value)}
              placeholder={odT(locale, "od.podUrlPh")}
              className="w-full rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
            <input
              value={podSig}
              onChange={(e) => setPodSig(e.target.value)}
              placeholder={odT(locale, "od.sigPh")}
              className="w-full rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
            <input
              value={podCode}
              onChange={(e) => setPodCode(e.target.value)}
              placeholder={odT(locale, "od.codePh")}
              className="w-full rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
            {order.pod_completed_at && (
              <p className="text-xs text-green-800">
                {odT(locale, "od.podDone")} {new Date(order.pod_completed_at).toLocaleString(dateLoc)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveTrackingAndPod}
            disabled={savingTrack}
            className="rounded-xl bg-[#0d2137] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {savingTrack ? odT(locale, "od.saving") : odT(locale, "od.saveEtaPod")}
          </button>
          <button
            type="button"
            onClick={markPodCompletedNow}
            disabled={savingTrack}
            className="rounded-xl border-2 border-green-600 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-900 hover:bg-green-100 disabled:opacity-60"
          >
            {odT(locale, "od.podCompleteNow")}
          </button>
        </div>
        {(() => {
          const previewUrl = (podPhoto.trim() || order.pod_photo_url || "").trim();
          const canSendDeliveryMail =
            Boolean(order.customer_email?.trim()) &&
            (order.logistics_status === "delivered" ||
              Boolean(order.pod_completed_at) ||
              Boolean(previewUrl));
          if (!canSendDeliveryMail) return null;
          return (
            <div className="mt-4 rounded-xl border-2 border-sky-200 bg-sky-50/60 p-4">
              <p className="text-sm font-semibold text-[#0d2137]">{odT(locale, "od.deliveryBlockTitle")}</p>
              <p className="mt-1 text-xs text-[#0d2137]/70">{odT(locale, "od.deliveryBlockDesc")}</p>
              <div className="mt-3 rounded-lg border border-sky-200/80 bg-white/90 p-3">
                <p className="mb-2 text-xs font-medium text-[#0d2137]/80">{odT(locale, "od.podPhotoLabel")}</p>
                {previewUrl ? (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block max-w-full overflow-hidden rounded-lg border border-sky-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt={odT(locale, "od.podPhotoAlt")}
                      className="max-h-56 w-auto max-w-full object-contain"
                    />
                  </a>
                ) : (
                  <p className="text-xs text-amber-900">{odT(locale, "od.deliveryNoPreview")}</p>
                )}
              </div>
              <label
                className={`mt-3 flex cursor-pointer items-start gap-2 text-sm text-[#0d2137] ${
                  !previewUrl ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 accent-sky-700"
                  checked={attachPodToEmail && Boolean(previewUrl)}
                  disabled={!previewUrl}
                  onChange={(e) => setAttachPodToEmail(e.target.checked)}
                />
                <span>{odT(locale, "od.deliveryAttachLabel")}</span>
              </label>
              <button
                type="button"
                disabled={sendingDeliveryConfirm || !order.customer_email?.trim()}
                onClick={async () => {
                  if (!order.customer_email?.trim()) {
                    alert(OD_MAIL_DE.alertNoCustomerEmail);
                    return;
                  }
                  const gateOk =
                    order.logistics_status === "delivered" ||
                    Boolean(order.pod_completed_at) ||
                    Boolean(previewUrl);
                  if (!gateOk) {
                    alert(odT(locale, "od.deliveryGateError"));
                    return;
                  }
                  setSendingDeliveryConfirm(true);
                  try {
                    const res = await fetch(`/api/admin/orders/${order.id}/send-delivery-confirmation-email`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        pod_photo_url: previewUrl || undefined,
                        attach_photo: Boolean(previewUrl) && attachPodToEmail,
                      }),
                    });
                    const data = (await res.json()) as {
                      error?: string;
                      sentTo?: string;
                      photoAttached?: boolean;
                      photoIncludedInEmail?: boolean;
                    };
                    if (!res.ok) {
                      alert(data?.error ?? odT(locale, "od.alertDeliveryFail"));
                      return;
                    }
                    let msg = odT(locale, "od.deliverySent") + (data.sentTo ?? order.customer_email);
                    if (data.photoAttached) msg += `\n${odT(locale, "od.deliveryAttachNoteYes")}`;
                    else if (data.photoIncludedInEmail)
                      msg += `\n${odT(locale, "od.deliveryAttachNoteInline")}`;
                    alert(msg);
                  } catch {
                    alert(OD_MAIL_DE.alertNetwork);
                  } finally {
                    setSendingDeliveryConfirm(false);
                  }
                }}
                className="mt-3 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingDeliveryConfirm ? odT(locale, "od.deliverySending") : odT(locale, "od.deliverySendBtn")}
              </button>
              {!order.customer_email?.trim() && (
                <p className="mt-2 text-xs text-amber-800">{OD_MAIL_DE.addCustomerEmail}</p>
              )}
            </div>
          );
        })()}
        <div className="mt-6 border-t border-[#0d2137]/10 pt-4">
          <p className="mb-2 text-sm font-medium text-[#0d2137]">{odT(locale, "od.gpsManualTitle")}</p>
          <div className="flex max-w-xl flex-wrap gap-2">
            <input
              value={latIn}
              onChange={(e) => setLatIn(e.target.value)}
              placeholder={odT(locale, "od.latPh")}
              className="min-w-[8rem] flex-1 rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
            <input
              value={lngIn}
              onChange={(e) => setLngIn(e.target.value)}
              placeholder={odT(locale, "od.lngPh")}
              className="min-w-[8rem] flex-1 rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={submitDriverGps}
              disabled={savingLocation}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {savingLocation ? odT(locale, "od.savingShort") : odT(locale, "od.savePos")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
