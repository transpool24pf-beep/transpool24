"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import type { TrailPointMap } from "@/components/OrderTrackMap";
import { bcp47ForSiteLocale } from "@/lib/bcp47-locale";

const OrderTrackMap = dynamic(
  () => import("@/components/OrderTrackMap").then((m) => m.OrderTrackMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-[#0d2137]/10 bg-[#0d2137]/[0.04] text-sm text-[var(--foreground)]/60">
        …
      </div>
    ),
  }
);

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
  distance_km?: number | null;
};

type DriverPublic = {
  full_name: string;
  phone: string;
  vehicle_plate: string | null;
  languages_spoken: string | null;
  personal_photo_url: string | null;
  star_rating: number | null;
};

type RoutePlan = {
  pickup_lat: number;
  pickup_lng: number;
  delivery_lat: number;
  delivery_lng: number;
  line: GeoJSON.LineString;
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
  const [driver, setDriver] = useState<DriverPublic | null>(null);
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
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
      .then(
        (data: {
          job: TrackJob;
          driver: DriverPublic | null;
          route_plan: RoutePlan | null;
          trail: TrailPoint[];
          stops: StopRow[];
          delivered: boolean;
        }) => {
          setJob(data.job);
          setDriver(data.driver ?? null);
          setRoutePlan(data.route_plan ?? null);
          setTrail(data.trail ?? []);
          setStops(data.stops ?? []);
          setDelivered(Boolean(data.delivered));
        }
      )
      .catch((e) => {
        setError(e instanceof Error ? e.message : t("invalidLink"));
        setJob(null);
      })
      .finally(() => setLoading(false));
  }, [jobId, token, t]);

  useEffect(() => {
    load();
  }, [load]);

  const lat = job?.last_driver_lat != null ? Number(job.last_driver_lat) : null;
  const lng = job?.last_driver_lng != null ? Number(job.last_driver_lng) : null;
  const hasLivePosition = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

  const trailForMap: TrailPointMap[] = useMemo(
    () =>
      trail.map((p) => ({
        lat: Number(p.latitude),
        lng: Number(p.longitude),
        recorded_at: p.recorded_at,
      })),
    [trail]
  );

  const googleDirUrl = useMemo(() => {
    if (!job) return "";
    return `https://www.google.com/maps/dir/${encodeURIComponent(job.pickup_address)}/${encodeURIComponent(job.delivery_address)}`;
  }, [job]);

  /** Opens Google Maps centered on live GPS with street-level zoom (better than plain ?q= for tracking). */
  const googleMapsLiveTrackingUrl = useMemo(() => {
    if (!hasLivePosition || lat == null || lng == null) return "";
    const la = lat.toFixed(6);
    const ln = lng.toFixed(6);
    return `https://www.google.com/maps/@${la},${ln},17z`;
  }, [hasLivePosition, lat, lng]);

  const showMap = Boolean(
    routePlan ||
      hasLivePosition ||
      trailForMap.length >= 1
  );

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

      {driver && driver.full_name && (
        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-[var(--primary)]">{t("trackYourDriver")}</h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {driver.personal_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={driver.personal_photo_url}
                alt=""
                className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-[#0d2137]/10"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#0d2137]/10 text-3xl text-[#0d2137]/40">
                ···
              </div>
            )}
            <dl className="min-w-0 flex-1 space-y-1 text-sm">
              <dt className="sr-only">{t("trackDriverName")}</dt>
              <dd className="text-lg font-semibold text-[var(--primary)]">{driver.full_name}</dd>
              {driver.star_rating != null && (
                <dd className="text-amber-600">★ {driver.star_rating.toFixed(1)}</dd>
              )}
              <div>
                <dt className="text-[var(--foreground)]/60">{t("trackDriverPhone")}</dt>
                <dd>
                  <a href={`tel:${driver.phone}`} className="font-medium text-[var(--accent)] hover:underline">
                    {driver.phone}
                  </a>
                </dd>
              </div>
              {driver.vehicle_plate && (
                <div>
                  <dt className="text-[var(--foreground)]/60">{t("trackDriverPlate")}</dt>
                  <dd className="font-mono">{driver.vehicle_plate}</dd>
                </div>
              )}
              {driver.languages_spoken && (
                <div>
                  <dt className="text-[var(--foreground)]/60">{t("trackDriverLanguages")}</dt>
                  <dd>{driver.languages_spoken}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {!driver?.full_name && (
        <p className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-950/90">
          {t("trackDriverPending")}
        </p>
      )}

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
          {job.distance_km != null && (
            <div>
              <dt className="text-[var(--foreground)]/60">{t("trackDistance")}</dt>
              <dd>{job.distance_km} km</dd>
            </div>
          )}
          {job.estimated_arrival_at && (
            <div>
              <dt className="text-[var(--foreground)]/60">{t("trackEta")}</dt>
              <dd>
                {new Date(job.estimated_arrival_at).toLocaleString(bcp47ForSiteLocale(locale), {
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
                {new Date(job.last_driver_location_at).toLocaleString(bcp47ForSiteLocale(locale), {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {!delivered &&
        !hasLivePosition &&
        job.logistics_status !== "cancelled" &&
        job.logistics_status !== "draft" && (
          <div className="rounded-lg border border-sky-200 bg-sky-50/90 p-4 text-sm text-sky-950">
            {t("trackNoPosition")}
          </div>
        )}

      {showMap && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--primary)]">{t("trackMapTitle")}</h2>
          <p className="text-sm text-[var(--foreground)]/75">{t("trackMapHint")}</p>
          <OrderTrackMap
            pickup={
              routePlan
                ? { lat: routePlan.pickup_lat, lng: routePlan.pickup_lng }
                : null
            }
            delivery={
              routePlan
                ? { lat: routePlan.delivery_lat, lng: routePlan.delivery_lng }
                : null
            }
            routeLine={routePlan?.line ?? null}
            livePosition={hasLivePosition && lat != null && lng != null ? { lat, lng } : null}
            liveMarkerPhotoUrl={driver?.personal_photo_url ?? null}
            trail={trailForMap}
            pickupLabel={t("trackPickup")}
            deliveryLabel={t("trackDelivery")}
            liveLabel={t("trackLiveMarker")}
          />
        </div>
      )}

      {!showMap && (
        <div className="space-y-3 rounded-lg border border-dashed border-[#0d2137]/25 bg-[#0d2137]/[0.03] p-4 text-sm text-[var(--foreground)]/80">
          <p>{t("trackNoGeocode")}</p>
          <a
            href={googleDirUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-medium text-[var(--accent)] hover:underline"
          >
            {t("trackOpenGoogleDirections")}
          </a>
        </div>
      )}

      {hasLivePosition && googleMapsLiveTrackingUrl && (
        <a
          href={googleMapsLiveTrackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3.5 text-center text-sm font-semibold text-white shadow-md transition hover:opacity-95"
        >
          {t("trackMapLink")}
        </a>
      )}

      <div className="flex flex-wrap gap-2">
        <a
          href={googleDirUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border-2 border-[#0d2137]/20 bg-white px-4 py-2 text-sm font-medium text-[#0d2137] hover:bg-[#0d2137]/5"
        >
          {t("trackOpenGoogleDirections")}
        </a>
      </div>

      {stops.length > 0 && (
        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-5">
          <h2 className="mb-3 font-semibold text-[var(--primary)]">{t("trackStops")}</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {stops.map((s) => (
              <li key={s.sequence_order}>
                <span className="font-medium">{s.address}</span>
                {s.city ? `, ${s.city}` : ""}
                {s.completed_at ? <span className="ml-2 text-green-700">✓</span> : null}
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
                {Number(p.latitude).toFixed(5)}, {Number(p.longitude).toFixed(5)} —{" "}
                {new Date(p.recorded_at).toLocaleTimeString(bcp47ForSiteLocale(locale), {
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
