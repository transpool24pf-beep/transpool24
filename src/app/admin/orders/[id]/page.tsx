"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const assistantEur = "16.30";
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
    ...(volumeStr ? [`${IC.package} Maße (L×B×H): ${volumeStr}`] : []),
    ...(weightKg != null ? [`${IC.scale} Gewicht: ${weightKg} kg`] : []),
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
    ...(hasAssistant ? [`${IC.worker} Helferpauschale: ${assistantEur} EUR`] : []),
  ];
  return blocks.join("\n");
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [order, setOrder] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingTrackOnly, setSendingTrackOnly] = useState(false);
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
  }, [order]);

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

  const sendEmailToCustomer = () => {
    if (!order?.customer_email) return;
    if (!order.assigned_driver_application_id) {
      alert("Bitte zuerst einen Fahrer wählen (erscheint in der Kunden-E-Mail).");
      return;
    }
    setSending(true);
    fetch("/api/admin/send-order-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: order.id }),
    })
      .then((r) => {
        if (r.ok) alert("E-Mail gesendet an: " + order.customer_email);
        else
          r.json().then((d) => {
            const errMsg =
              typeof d?.error === "string"
                ? d.error
                : (d?.error && typeof d.error === "object" && "message" in d.error)
                  ? String((d.error as { message: unknown }).message)
                  : "Senden fehlgeschlagen.";
            alert(errMsg);
          });
      })
      .catch(() => alert("Anfrage fehlgeschlagen."))
      .finally(() => setSending(false));
  };

  const sendTrackingOnlyEmail = () => {
    if (!order?.customer_email) return;
    if (!order.confirmation_token) {
      alert("Kein Bestätigungstoken (confirmation_token) – Tracking-E-Mail nicht möglich.");
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
        if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Senden fehlgeschlagen.");
        return j;
      })
      .then(() => {
        alert("Tracking-Nachricht gesendet (ohne PDF) an: " + order.customer_email);
      })
      .catch((e) => alert(e instanceof Error ? e.message : "Senden fehlgeschlagen."))
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
      alert("Bitte zuerst einen Fahrer auswählen.");
      return;
    }
    const driverRow = drivers.find((d) => d.id === order.assigned_driver_application_id);
    if (!driverRow?.phone) {
      alert("Keine Telefon-/WhatsApp-Nummer in der Fahrerbewerbung hinterlegt.");
      return;
    }
    const digits = driverRow.phone.replace(/\D/g, "");
    if (!digits) {
      alert("Ungültige Fahrernummer für WhatsApp.");
      return;
    }
    const pickupUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.pickup_address)}&travelmode=driving`;
    const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(order.pickup_address)}&destination=${encodeURIComponent(order.delivery_address)}&travelmode=driving`;
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
          "📲 Sendungsverfolgung für den Kunden (während der Fahrt öffnen – der Kunde sieht die Sendung auf dem Weg zur Lieferung):",
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
      "🛣️ 2) Gesamtfahrt von der Abholung bis zur Zustellung (ein Tippen) – Route in Google Maps:",
      routeUrl,
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
      alert("Kein Bestätigungstoken – bitte zuerst Bestätigungs-E-Mail senden oder Datenbank prüfen.");
      return;
    }
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${base}/de/order/track?job_id=${encodeURIComponent(order.id)}&token=${encodeURIComponent(order.confirmation_token)}`;
    void navigator.clipboard.writeText(url).then(
      () => alert("Tracking-Link für Kunden kopiert:\n" + url),
      () => {
        prompt("Link manuell kopieren:", url);
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
          throw new Error((typeof j.error === "string" ? j.error : "Fehler") + hint);
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
        if (ok)
          alert(
            "Fahrer-GPS-Link kopiert. Per WhatsApp oder SMS senden – Fahrer öffnet den Link und startet die Standortfreigabe.\n\n" +
              url
          );
        else prompt("Link manuell kopieren:", url);
        return fetch(`/api/admin/orders/${order.id}`).then((r) => r.json());
      })
      .then((data: Job) => setOrder(data))
      .catch((e) => alert(e instanceof Error ? e.message : "Fehler"))
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
        if (!r.ok) throw new Error(typeof data.error === "string" ? data.error : "Speichern fehlgeschlagen.");
        return data as Job;
      })
      .then((data) => {
        setOrder((prev) => (prev ? { ...prev, ...data } : null));
        alert("ETA und POD-Daten gespeichert.");
      })
      .catch((e) => alert(e instanceof Error ? e.message : "Speichern fehlgeschlagen."))
      .finally(() => setSavingTrack(false));
  };

  const markPodCompletedNow = () => {
    if (!order) return;
    if (!window.confirm("Liefernachweis (POD) jetzt als abgeschlossen markieren?")) return;
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
        if (!r.ok) throw new Error(typeof data.error === "string" ? data.error : "Fehler");
        return data as Job;
      })
      .then((data) => {
        setOrder((prev) => (prev ? { ...prev, ...data } : null));
        alert("POD als abgeschlossen gespeichert.");
      })
      .catch((e) => alert(e instanceof Error ? e.message : "Fehler"))
      .finally(() => setSavingTrack(false));
  };

  const submitDriverGps = () => {
    if (!order) return;
    const lat = parseFloat(latIn.replace(",", "."));
    const lng = parseFloat(lngIn.replace(",", "."));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      alert("Bitte gültige Breiten- und Längengrade eingeben.");
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
        if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "GPS speichern fehlgeschlagen.");
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
        alert("GPS-Position gespeichert (sichtbar in der Kunden-Tracking-Seite).");
      })
      .catch((e) => alert(e instanceof Error ? e.message : "Fehler"))
      .finally(() => setSavingLocation(false));
  };

  if (loading || !id) {
    return (
      <div className="rounded-2xl bg-white p-10 shadow-lg">
        <p className="text-[#0d2137]/70">Wird geladen…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">Auftrag nicht gefunden.</p>
        <Link href="/admin/orders" className="text-[var(--accent)] hover:underline">
          ← Zurück zur Auftragsliste
        </Link>
      </div>
    );
  }

  const driverPriceEur = getDriverPriceEur(order);
  const customerPriceEur = (order.price_cents / 100).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#0d2137]">Auftragsdetails</h1>
        <Link
          href="/admin/orders"
          className="rounded-xl border-2 border-[#0d2137]/20 bg-white px-4 py-2 text-sm font-medium text-[#0d2137] hover:bg-[#0d2137]/5"
        >
          ← Zurück zur Auftragsliste
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">Auftragsdaten</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[#0d2137]/60">Auftragsnummer</dt>
              <dd className="font-mono font-semibold text-[#0d2137]">{order.order_number ?? order.id}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">Datum (Erstellung)</dt>
              <dd>{new Date(order.created_at).toLocaleDateString("de-DE")}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">Zahlung (Kunde)</dt>
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
                    ? "Bezahlt"
                    : order.payment_status === "pending"
                      ? "Ausstehend"
                      : order.payment_status === "refunded"
                        ? "Erstattet"
                        : order.payment_status === "failed"
                          ? "Fehlgeschlagen"
                          : order.payment_status}
                </span>
                {order.payment_status !== "paid" ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!order || !window.confirm("Kundenzahlung als „bezahlt“ bestätigen? (z. B. Nachnahme / Überweisung geprüft)")) return;
                      fetch("/api/admin/orders", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: order.id, payment_status: "paid" }),
                      })
                        .then(async (r) => {
                          const data = await r.json();
                          if (!r.ok) throw new Error(typeof data.error === "string" ? data.error : "Fehler");
                          return data as Job;
                        })
                        .then((data) => setOrder((prev) => (prev ? { ...prev, ...data } : null)))
                        .then(() => alert("Zahlungsstatus: Bezahlt gespeichert. PDF-Rechnung zeigt „Bezahlt“."))
                        .catch((e) => alert(e instanceof Error ? e.message : "Fehler"));
                    }}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Als bezahlt markieren
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!order || !window.confirm("Zahlungsstatus wieder auf „ausstehend“ setzen?")) return;
                      fetch("/api/admin/orders", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: order.id, payment_status: "pending" }),
                      })
                        .then(async (r) => {
                          const data = await r.json();
                          if (!r.ok) throw new Error(typeof data.error === "string" ? data.error : "Fehler");
                          return data as Job;
                        })
                        .then((data) => setOrder((prev) => (prev ? { ...prev, ...data } : null)))
                        .catch((e) => alert(e instanceof Error ? e.message : "Fehler"));
                    }}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                  >
                    Auf ausstehend setzen
                  </button>
                )}
              </dd>
            </div>
            {order.preferred_pickup_at && (
              <div>
                <dt className="text-[#0d2137]/60">Gewünschte Abholzeit</dt>
                <dd className="font-medium text-[#0d2137]">{new Date(order.preferred_pickup_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</dd>
              </div>
            )}
            <div>
              <dt className="text-[#0d2137]/60">Firma</dt>
              <dd>{order.company_name}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">Telefon / WhatsApp</dt>
              <dd>{order.phone}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">E-Mail (Kunde)</dt>
              <dd>{order.customer_email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">Abholung</dt>
              <dd>{order.pickup_address}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">Zustellung</dt>
              <dd>{order.delivery_address}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">Ladung (Größe)</dt>
              <dd>{order.cargo_size}</dd>
            </div>
            {(order.cargo_details && (typeof (order.cargo_details as { weightKg?: number }).weightKg === "number" || typeof (order.cargo_details as { cargoWeightKg?: number }).cargoWeightKg === "number")) && (
              <div>
                <dt className="text-[#0d2137]/60">Gewicht</dt>
                <dd>{(order.cargo_details as { weightKg?: number; cargoWeightKg?: number }).weightKg ?? (order.cargo_details as { cargoWeightKg?: number }).cargoWeightKg} kg</dd>
              </div>
            )}
            <div>
              <dt className="text-[#0d2137]/60">Distanz</dt>
              <dd>{order.distance_km != null ? `${order.distance_km} km` : "—"}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">Kundenpreis (System)</dt>
              <dd className="font-semibold text-[#0d2137]">€ {customerPriceEur}</dd>
            </div>
            <div>
              <dt className="text-[#0d2137]/60">Fahrerpreis (Gruppe)</dt>
              <dd className="font-semibold text-amber-700">€ {driverPriceEur}</dd>
            </div>
            {(order.customer_driver_rating != null || order.customer_driver_comment) && (
              <div>
                <dt className="text-[#0d2137]/60">Kundenbewertung Fahrer</dt>
                <dd className="rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] p-2 text-sm">
                  {order.customer_driver_rating != null && (
                    <span className="text-amber-600 font-medium">★ {order.customer_driver_rating} Sterne</span>
                  )}
                  {order.customer_driver_comment && (
                    <p className="mt-1 text-[#0d2137]/80">«{order.customer_driver_comment}»</p>
                  )}
                </dd>
              </div>
            )}
            <div>
              <dt className="mb-1.5 text-[#0d2137]/60">Fahrer (Bewerbung)</dt>
              <dd>
                <select
                  value={order.assigned_driver_application_id ?? ""}
                  onChange={(e) => assignDriver(e.target.value || null)}
                  disabled={updatingDriver}
                  className="w-full max-w-xs rounded-lg border-2 border-[#0d2137]/20 bg-white px-3 py-2 text-sm font-medium text-[#0d2137] focus:border-[var(--accent)] focus:outline-none disabled:opacity-60"
                >
                  <option value="">— kein Fahrer —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.driver_number != null ? `#${String(d.driver_number)} – ${d.full_name}` : d.full_name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[#0d2137]/50">Fahrer wählen, bevor die Bestätigungs-E-Mail an den Kunden gesendet wird.</p>
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-[#0d2137]">Versand & Rechnungen</h2>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={openWhatsApp}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 font-medium text-white shadow-sm hover:bg-[#20bd5a]"
            >
              WhatsApp Gruppe (nur Fahrerpreis)
            </button>
            <button
              type="button"
              onClick={openWhatsAppCustomer}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#25D366] bg-[#25D366]/10 px-4 py-3 font-medium text-[#25D366] hover:bg-[#25D366]/20"
            >
              WhatsApp Kunde ({order.phone})
            </button>
            <button
              type="button"
              onClick={() => void openWhatsAppDriverNavLinks()}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-emerald-700 bg-emerald-700 px-4 py-3 text-center font-medium text-white shadow-sm hover:bg-emerald-800"
            >
              <span>WhatsApp Fahrer: Kundendaten + Route + Sendungsverfolgung</span>
              <span className="text-xs font-normal opacity-90">
                Kunde/Kontakt, Abholort (1×), Gesamtstrecke, TransPool24-Link für Live-Tracking
              </span>
            </button>
            {order.customer_email && (
              <>
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-3">
                  <label className="mb-1.5 block text-sm font-medium text-amber-900">Fahrer (vor E-Mail erforderlich)</label>
                  <select
                    value={order.assigned_driver_application_id ?? ""}
                    onChange={(e) => assignDriver(e.target.value || null)}
                    disabled={updatingDriver}
                    className="w-full rounded-lg border-2 border-amber-300 bg-white px-3 py-2 text-sm font-medium text-[#0d2137] focus:border-[var(--accent)] focus:outline-none disabled:opacity-60"
                  >
                    <option value="">— Fahrer wählen —</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.driver_number != null ? `#${String(d.driver_number)} – ${d.full_name}` : d.full_name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-amber-800/80">Fahrerdaten (Foto, Sterne, Telefon, Kennzeichen, Sprachen) erscheinen in der Kunden-E-Mail.</p>
                </div>
                <button
                  type="button"
                  onClick={sendEmailToCustomer}
                  disabled={sending || !order.assigned_driver_application_id}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? "Wird gesendet…" : "Bestätigungs-E-Mail an Kunden senden"}
                </button>
                <button
                  type="button"
                  onClick={sendTrackingOnlyEmail}
                  disabled={sendingTrackOnly}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#0d2137] bg-[#0d2137] px-4 py-3 font-medium text-white shadow-sm hover:bg-[#0d2137]/90 disabled:opacity-60"
                >
                  {sendingTrackOnly ? "Wird gesendet…" : "Tracking-Nachricht senden (ohne PDF)"}
                </button>
                <p className="text-xs text-[#0d2137]/65">
                  Professioneller Text auf Deutsch, Fahrerinfos falls zugewiesen, Tracking-Link mit Karte – ohne PDF-Anhang.
                </p>
              </>
            )}
            <hr className="border-[#0d2137]/10" />
            <p className="text-sm font-medium text-[#0d2137]">Rechnungen herunterladen</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadInvoice("customer")}
                className="rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-100"
              >
                Systemrechnung (Kundenpreis € {customerPriceEur})
              </button>
              <button
                type="button"
                onClick={() => downloadInvoice("driver")}
                className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
              >
                Gruppe / Fahrer-Rechnung (€ {driverPriceEur})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold text-[#0d2137]">Live-Tracking, ETA, Liefernachweis (POD)</h2>
        <p className="mb-4 text-sm text-[#0d2137]/65">
          Kunden-Tracking:{" "}
          <code className="rounded bg-[#0d2137]/10 px-1">/de/order/track?job_id=…&amp;token=…</code>.{" "}
          <strong>Pflicht für den Fahrer:</strong> Zuerst Live-Standort über den <strong>Fahrer-GPS-Link</strong> freigeben (mindestens
          eine Position) – erst danach kann er das Lieferfoto senden; ohne GPS kein POD-Upload. Beim ersten GPS-Ping wird der Status
          ggf. auf <strong>Unterwegs</strong> gesetzt und eine <strong>ETA</strong> aus der Fahrzeit des Auftrags vorbefüllt, sofern
          noch leer. Lieferfoto setzt <strong>Zugestellt</strong> und erscheint hier automatisch.
        </p>
        <div className="flex flex-wrap gap-2 border-b border-[#0d2137]/10 pb-4">
          <button
            type="button"
            onClick={copyTrackingLink}
            className="rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[#0d2137] hover:bg-[var(--accent)]/20"
          >
            Kunden-Tracking-Link kopieren
          </button>
          <button
            type="button"
            onClick={copyDriverGpsShareLink}
            disabled={ensuringDriverLink}
            className="rounded-xl border-2 border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
          >
            {ensuringDriverLink ? "…" : "Fahrer-GPS-Link kopieren (Live-Freigabe)"}
          </button>
          {order.driver_tracking_token && (
            <span className="self-center text-xs text-emerald-800/80">Fahrer-Token aktiv – getrennt vom Kunden-Link</span>
          )}
          {order.last_driver_lat != null && order.last_driver_lng != null && (
            <span className="self-center text-xs text-[#0d2137]/60">
              Letzte Position: {order.last_driver_lat.toFixed(5)}, {order.last_driver_lng.toFixed(5)}
              {order.last_driver_location_at
                ? ` — ${new Date(order.last_driver_location_at).toLocaleString("de-DE")}`
                : ""}
            </span>
          )}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#0d2137]">Voraussichtliche Ankunft (ETA)</p>
            <label className="block text-xs text-[#0d2137]/60">Datum und Uhrzeit</label>
            <input
              type="datetime-local"
              value={etaLocal}
              onChange={(e) => setEtaLocal(e.target.value)}
              className="w-full max-w-md rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
            <label className="block text-xs text-[#0d2137]/60">Verbleibende Minuten</label>
            <input
              type="number"
              min={0}
              value={etaMin}
              onChange={(e) => setEtaMin(e.target.value)}
              placeholder="z. B. 25"
              className="w-full max-w-xs rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#0d2137]">Liefernachweis (URLs / Code)</p>
            {order.pod_photo_url ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-emerald-800">Lieferfoto (vom Fahrer oder URL)</p>
                <a
                  href={order.pod_photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block max-w-full overflow-hidden rounded-lg border-2 border-emerald-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={order.pod_photo_url} alt="Liefernachweis" className="max-h-48 w-auto max-w-full object-contain" />
                </a>
              </div>
            ) : null}
            <input
              value={podPhoto}
              onChange={(e) => setPodPhoto(e.target.value)}
              placeholder="Foto-URL Liefernachweis (manuell, falls kein Upload)"
              className="w-full rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
            <input
              value={podSig}
              onChange={(e) => setPodSig(e.target.value)}
              placeholder="Unterschrift-URL"
              className="w-full rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
            <input
              value={podCode}
              onChange={(e) => setPodCode(e.target.value)}
              placeholder="Bestätigungscode Zustellung"
              className="w-full rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
            {order.pod_completed_at && (
              <p className="text-xs text-green-800">
                POD abgeschlossen: {new Date(order.pod_completed_at).toLocaleString("de-DE")}
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
            {savingTrack ? "Speichern…" : "ETA & POD speichern"}
          </button>
          <button
            type="button"
            onClick={markPodCompletedNow}
            disabled={savingTrack}
            className="rounded-xl border-2 border-green-600 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-900 hover:bg-green-100 disabled:opacity-60"
          >
            POD jetzt abschließen
          </button>
        </div>
        <div className="mt-6 border-t border-[#0d2137]/10 pt-4">
          <p className="mb-2 text-sm font-medium text-[#0d2137]">Fahrerposition manuell (Trail + letzte Position)</p>
          <div className="flex max-w-xl flex-wrap gap-2">
            <input
              value={latIn}
              onChange={(e) => setLatIn(e.target.value)}
              placeholder="Latitude"
              className="min-w-[8rem] flex-1 rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
            <input
              value={lngIn}
              onChange={(e) => setLngIn(e.target.value)}
              placeholder="Longitude"
              className="min-w-[8rem] flex-1 rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={submitDriverGps}
              disabled={savingLocation}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {savingLocation ? "…" : "Position speichern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
