"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type TrackJob = {
  id: string;
  order_number: number | null;
  logistics_status: string;
  pickup_address: string;
  delivery_address: string;
  estimated_arrival_at: string | null;
  eta_minutes_remaining: number | null;
  last_driver_lat: number | null;
  last_driver_lng: number | null;
  last_driver_location_at: string | null;
  pod_completed_at: string | null;
};

type TrailPoint = { latitude: number; longitude: number; recorded_at: string };
type StopRow = {
  sequence_order: number;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  completed_at: string | null;
};

export function OrderTrackClient({
  jobId,
  token,
  locale,
}: {
  jobId: string | null;
  token: string | null;
  locale: string;
}) {
  const t = useTranslations("order");
  const [job, setJob] = useState<TrackJob | null>(null);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [stops, setStops] = useState<StopRow[]>([]);
  const [delivered, setDelivered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!jobId || !token) {
      setError(t("trackMissingParams"));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(
      `/api/public/order-tracking?job_id=${encodeURIComponent(jobId)}&token=${encodeURIComponent(token)}`
    )
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || "Failed"); });
        return res.json();
      })
      .then((data: { job: TrackJob; trail: TrailPoint[]; stops: StopRow[]; delivered: boolean }) => {
        setJob(data.job);
        setTrail(data.trail ?? []);
        setStops(data.stops ?? []);
        setDelivered(Boolean(data.delivered));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : t("invalidLink"));
        setJob(null);
      })
      .finally(() => setLoading(false));
  }, [jobId, token, t]);

  useEffect(() => {
    load();
  }, [load]);

  const lat = job?.last_driver_lat;
  const lng = job?.last_driver_lng;
  const hasPosition =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

  const embedSrc =
    hasPosition && lat != null && lng != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.015},${lng + 0.02},${lat + 0.015}&layer=mapnik&marker=${lat}%2C${lng}`
      : null;

  if (loading && !job) {
    return (
      <div className="rounded-xl border border-[#0d2137]/10 bg-white p-8 text-center">
        <p className="text-[var(--foreground)]/70">{t("loading")}</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-4 rounded-xl border border-red-200 bg-red-50/50 p-6">
        <p className="text-red-800">{error ?? t("invalidLink")}</p>
        <Link
          href={`/${locale}/order`}
          className="inline-block font-medium text-[var(--accent)] hover:underline"
        >
          {t("backToOrder")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-[var(--foreground)]/80">{t("trackSubtitle")}</p>

      <div className="rounded-xl border border-[#0d2137]/10 bg-white p-5 shadow-sm">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--foreground)]/60">{t("orderRef")}</dt>
            <dd className="font-mono font-semibold">{job.order_number ?? job.id}</dd>
          </div>
          <div>
            <dt className="text-[var(--foreground)]/60">{t("trackStatus")}</dt>
            <dd className="font-medium capitalize">{job.logistics_status.replace(/_/g, " ")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[var(--foreground)]/60">{t("trackPickup")}</dt>
            <dd>{job.pickup_address}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[var(--foreground)]/60">{t("trackDelivery")}</dt>
            <dd>{job.delivery_address}</dd>
          </div>
          {job.estimated_arrival_at && (
            <div>
              <dt className="text-[var(--foreground)]/60">{t("trackEta")}</dt>
              <dd>
                {new Date(job.estimated_arrival_at).toLocaleString(locale === "ar" ? "ar" : locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
          )}
          {job.eta_minutes_remaining != null && (
            <div>
              <dt className="text-[var(--foreground)]/60">{t("trackEtaMinutesLabel")}</dt>
              <dd>{t("trackEtaMinutes", { minutes: job.eta_minutes_remaining })}</dd>
            </div>
          )}
          <div>
            <dt className="text-[var(--foreground)]/60">{t("trackDeliveredLabel")}</dt>
            <dd className={delivered ? "font-medium text-green-700" : ""}>
              {delivered ? t("trackDelivered") : t("trackNotDelivered")}
            </dd>
          </div>
          {job.last_driver_location_at && (
            <div className="sm:col-span-2">
              <dt className="text-[var(--foreground)]/60">{t("trackLastUpdate")}</dt>
              <dd>
                {new Date(job.last_driver_location_at).toLocaleString(locale === "ar" ? "ar" : locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {hasPosition && embedSrc && (
        <div className="overflow-hidden rounded-xl border border-[#0d2137]/10 bg-white shadow-sm">
          <iframe title="Map" className="h-[280px] w-full border-0" src={embedSrc} loading="lazy" />
          <div className="border-t border-[#0d2137]/10 p-3">
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              {t("trackMapLink")}
            </a>
          </div>
        </div>
      )}

      {!hasPosition && (
        <p className="rounded-lg border border-dashed border-[#0d2137]/20 bg-[#0d2137]/[0.03] p-4 text-sm text-[var(--foreground)]/70">
          {t("trackNoPosition")}
        </p>
      )}

      {stops.length > 0 && (
        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-5">
          <h2 className="mb-3 font-semibold text-[var(--primary)]">{t("trackStops")}</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {stops.map((s) => (
              <li key={s.sequence_order}>
                <span className="font-medium">{s.address}</span>
                {s.city ? `, ${s.city}` : ""}
                {s.completed_at ? (
                  <span className="ml-2 text-green-700">✓</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      )}

      {trail.length > 0 && (
        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-5">
          <h2 className="mb-3 font-semibold text-[var(--primary)]">{t("trackTrail")}</h2>
          <ul className="max-h-40 space-y-1 overflow-y-auto font-mono text-xs text-[var(--foreground)]/80">
            {trail.slice(0, 15).map((p, i) => (
              <li key={`${p.recorded_at}-${i}`}>
                {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)} —{" "}
                {new Date(p.recorded_at).toLocaleTimeString(locale === "ar" ? "ar" : locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => load()}
          className="rounded-xl border-2 border-[#0d2137]/20 bg-white px-4 py-2 text-sm font-medium text-[#0d2137] hover:bg-[#0d2137]/5"
        >
          {t("trackRefresh")}
        </button>
        <Link
          href={`/${locale}/order`}
          className="rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20"
        >
          {t("backToOrder")}
        </Link>
      </div>
    </div>
  );
}
