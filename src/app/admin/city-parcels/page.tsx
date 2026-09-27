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
  work_focus?: string | null;
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

export default function AdminCityParcelsPage() {
  const { t } = useAdminLocale();
  const [cityQuery, setCityQuery] = useState("Pforzheim");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/drivers")
      .then((r) => r.json())
      .then((d) => setDrivers(Array.isArray(d) ? d : []))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = norm(cityQuery);
  const cityDrivers = useMemo(() => {
    return drivers.filter((d) => {
      if (d.suspended_at) return false;
      if (d.work_focus !== "city_parcels") return false;
      if (!q) return Boolean(d.city);
      const c = norm(d.city || "");
      return c.includes(q) || q.includes(c);
    });
  }, [drivers, q]);

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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#0d2137]">{t("cityParcels.title")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#0d2137]/70">{t("cityParcels.subtitle")}</p>
      <p className="mt-2 text-sm">
        <Link href="/admin/drivers" className="font-semibold text-[var(--accent)] underline">
          {t("nav.drivers")}
        </Link>
        {" · "}
        <Link href="/admin/driver-applications" className="font-semibold text-[var(--accent)] underline">
          {t("nav.driverApplications")}
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
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-[#0d2137]">{t("cityParcels.drivers")}</h2>
          {cityDrivers.length === 0 ? (
            <p className="mt-3 text-sm text-[#0d2137]/60">{t("cityParcels.noneDrivers")}</p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {cityDrivers.map((d) => (
                <li key={d.id} className="rounded-xl border border-[#0d2137]/10 bg-white p-4 shadow-sm">
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
                    {d.source === "application" ? (
                      <Link
                        href={`/admin/driver-applications/${d.id}`}
                        className="rounded-lg border border-[#0d2137]/20 px-3 py-1.5 text-xs font-semibold text-[#0d2137]"
                      >
                        {t("drivers.openProfile")}
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
