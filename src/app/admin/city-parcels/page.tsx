"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";

type Driver = {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  vehicle_plate: string | null;
  driver_number: number | null;
  source?: string;
  suspended_at?: string | null;
};

type Job = {
  id: string;
  company_name: string | null;
  pickup_address: string | null;
  delivery_address: string | null;
  logistics_status: string | null;
  assigned_driver_application_id: string | null;
  cargo_details: Record<string, unknown> | null;
  preferred_pickup_at: string | null;
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .trim();
}

function waDigits(phone: string): string | null {
  let d = phone.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = `49${d.slice(1)}`;
  return d.length >= 8 ? d : null;
}

function isParcelJob(j: Job): boolean {
  return j.cargo_details?.orderKind === "parcel_delivery" || j.cargo_details?.parcelDelivery === true;
}

function isOpenJob(j: Job): boolean {
  const s = (j.logistics_status || "").toLowerCase();
  return !["delivered", "cancelled", "canceled"].includes(s);
}

export default function AdminCityParcelsPage() {
  const { t, locale } = useAdminLocale();
  const [cityQuery, setCityQuery] = useState("Pforzheim");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/drivers").then((r) => r.json()),
      fetch("/api/admin/orders").then((r) => r.json()),
    ])
      .then(([d, o]) => {
        setDrivers(Array.isArray(d) ? d : []);
        setJobs(Array.isArray(o) ? o : []);
      })
      .catch(() => {
        setDrivers([]);
        setJobs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = norm(cityQuery);
  const cityDrivers = useMemo(() => {
    return drivers.filter((d) => {
      if (d.suspended_at) return false;
      if (!q) return Boolean(d.city);
      const c = norm(d.city || "");
      return c.includes(q) || q.includes(c);
    });
  }, [drivers, q]);

  const parcelJobs = useMemo(
    () => jobs.filter((j) => isParcelJob(j) && isOpenJob(j)),
    [jobs],
  );

  const offerWhatsApp = (d: Driver) => {
    const digits = waDigits(d.phone || "");
    if (!digits) return;
    const city = (d.city || cityQuery || "Pforzheim").trim();
    const text = [
      "TransPool24 – Stadtzustellung (Pakete)",
      `Stadt: ${city}`,
      d.full_name ? `Fahrer: ${d.full_name}` : "",
      "Können Sie heute innerorts Pakete zustellen? Bitte kurz per WhatsApp antworten.",
    ]
      .filter(Boolean)
      .join("\n");
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const assign = async (jobId: string, driverId: string) => {
    setAssigning(`${jobId}:${driverId}`);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: jobId,
          assigned_driver_application_id: driverId,
          logistics_status: "assigned",
        }),
      });
      if (res.ok) load();
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#0d2137]">{t("cityParcels.title")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#0d2137]/70">{t("cityParcels.subtitle")}</p>
      <p className="mt-2 text-sm">
        <Link href="/de/parcel-delivery" className="font-semibold text-[var(--accent)] underline" target="_blank">
          {locale === "ar" ? "صفحة حجز الطرود للعملاء" : "Kundenbuchung Paketzustellung"}
        </Link>
      </p>

      <label className="mt-6 block max-w-md text-sm font-medium text-[#0d2137]">
        {t("cityParcels.searchCity")}
        <input
          value={cityQuery}
          onChange={(e) => setCityQuery(e.target.value)}
          placeholder={t("cityParcels.searchPlaceholder")}
          className="mt-1 w-full rounded-xl border-2 border-[#0d2137]/15 px-3 py-2 text-[#0d2137]"
        />
      </label>

      {loading ? (
        <p className="mt-8 text-[#0d2137]/60">{t("cityParcels.loading")}</p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-lg font-semibold text-[#0d2137]">{t("cityParcels.drivers")}</h2>
            {cityDrivers.length === 0 ? (
              <p className="mt-3 text-sm text-[#0d2137]/60">{t("cityParcels.noneDrivers")}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {cityDrivers.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-xl border border-[#0d2137]/10 bg-white p-4 shadow-sm"
                  >
                    <p className="font-semibold text-[#0d2137]">
                      {d.full_name || "—"}
                      {d.driver_number != null ? (
                        <span className="ms-2 text-sm font-normal text-[#0d2137]/55">#{d.driver_number}</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm text-[#0d2137]/70" dir="ltr">
                      {d.city || t("cityParcels.allCities")}
                      {d.vehicle_plate ? ` · ${t("cityParcels.plate")} ${d.vehicle_plate}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {waDigits(d.phone || "") ? (
                        <button
                          type="button"
                          onClick={() => offerWhatsApp(d)}
                          className="rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          {t("cityParcels.whatsapp")}
                        </button>
                      ) : (
                        <span className="text-xs text-[#0d2137]/45">{t("cityParcels.noPhone")}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#0d2137]">{t("cityParcels.jobs")}</h2>
            {parcelJobs.length === 0 ? (
              <p className="mt-3 text-sm text-[#0d2137]/60">{t("cityParcels.noneJobs")}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {parcelJobs.map((j) => (
                  <li key={j.id} className="rounded-xl border border-[#0d2137]/10 bg-white p-4 shadow-sm">
                    <p className="font-semibold text-[#0d2137]">{j.company_name || "—"}</p>
                    <p className="mt-1 text-xs text-[#0d2137]/65">
                      {t("cityParcels.pickup")}: {j.pickup_address || "—"}
                    </p>
                    <p className="text-xs text-[#0d2137]/65">
                      {t("cityParcels.drop")}: {j.delivery_address || "—"}
                    </p>
                    {j.assigned_driver_application_id ? (
                      <p className="mt-2 text-xs font-medium text-teal-800">{t("cityParcels.assigned")}</p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {cityDrivers
                          .filter((d) => d.source === "application")
                          .slice(0, 8)
                          .map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              disabled={assigning === `${j.id}:${d.id}`}
                              onClick={() => void assign(j.id, d.id)}
                              className="rounded-lg border border-[#0d2137]/20 bg-white px-2 py-1 text-[11px] font-semibold text-[#0d2137] hover:bg-[#0d2137]/5 disabled:opacity-50"
                            >
                              {t("cityParcels.assign")}: {d.full_name || d.driver_number || d.id.slice(0, 6)}
                            </button>
                          ))}
                      </div>
                    )}
                    <Link
                      href={`/admin/orders/${j.id}`}
                      className="mt-2 inline-block text-xs font-semibold text-[var(--accent)] underline"
                    >
                      {locale === "ar" ? "فتح الطلب" : "Auftrag öffnen"}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
