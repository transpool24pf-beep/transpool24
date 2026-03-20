"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { mapsNavigateToDestination, mapsRoutePickupToDelivery } from "@/lib/google-maps-links";

type ValidateResponse = {
  ok?: boolean;
  order_number?: number | null;
  logistics_status?: string;
  pickup_address?: string;
  delivery_address?: string;
  distance_km?: number | null;
  duration_minutes?: number | null;
  error?: string;
};

const MIN_INTERVAL_MS = 12_000;

export function DriverShareLocationClient({
  jobId,
  token,
  locale,
}: {
  jobId: string | null;
  token: string | null;
  locale: string;
}) {
  const t = useTranslations("driverShare");
  const [valid, setValid] = useState<boolean | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const lastPostAt = useRef(0);

  const sendPosition = useCallback(
    async (lat: number, lng: number, accuracy?: number | null) => {
      if (!jobId || !token) return;
      const now = Date.now();
      if (now - lastPostAt.current < MIN_INTERVAL_MS) return;
      lastPostAt.current = now;
      try {
        const res = await fetch("/api/public/driver-share-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: jobId,
            token,
            latitude: lat,
            longitude: lng,
            accuracy_m: accuracy ?? undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
        setLastSent(data.recorded_at ?? new Date().toISOString());
        setMsg(t("sentOk"));
        setErr(null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("sendFailed"));
      }
    },
    [jobId, token, t]
  );

  useEffect(() => {
    if (!jobId || !token) {
      setValid(false);
      setErr(t("missingParams"));
      return;
    }
    fetch(`/api/public/driver-share-location?job_id=${encodeURIComponent(jobId)}&token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data: ValidateResponse) => {
        if (!data.ok) throw new Error(data.error || "invalid");
        setValid(true);
        setOrderNumber(data.order_number ?? null);
        setStatus(data.logistics_status ?? "");
        setPickup(data.pickup_address ?? "");
        setDelivery(data.delivery_address ?? "");
        setDistanceKm(data.distance_km ?? null);
        setDurationMinutes(data.duration_minutes ?? null);
      })
      .catch(() => {
        setValid(false);
        setErr(t("invalidLink"));
      });
  }, [jobId, token, t]);

  const stopSharing = useCallback(() => {
    if (watchId.current != null && typeof navigator !== "undefined" && navigator.geolocation?.clearWatch) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setSharing(false);
    setMsg(t("stopped"));
  }, [t]);

  const startSharing = useCallback(() => {
    if (!jobId || !token) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErr(t("noGeolocation"));
      return;
    }
    setErr(null);
    setMsg(t("starting"));
    setSharing(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        void sendPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (geoErr) => {
        setErr(geoErr.message || t("permissionDenied"));
        stopSharing();
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 }
    );
  }, [jobId, token, sendPosition, stopSharing, t]);

  useEffect(() => {
    return () => {
      if (watchId.current != null && typeof navigator !== "undefined" && navigator.geolocation?.clearWatch) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  if (valid === null) {
    return (
      <div className="rounded-xl border border-[#0d2137]/10 bg-white p-8 text-center">
        <p className="text-[var(--foreground)]/70">{t("loading")}</p>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/80 p-6 text-red-900">
        <p>{err ?? t("invalidLink")}</p>
        <Link href={`/${locale}`} className="mt-4 inline-block font-medium text-[var(--accent)] hover:underline">
          {t("home")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--primary)]">{t("title")}</h2>
        <p className="mt-2 text-sm text-[var(--foreground)]/80">{t("intro")}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-[var(--foreground)]/60">{t("orderRef")}</dt>
            <dd className="font-mono font-semibold">{orderNumber ?? "—"}</dd>
          </div>
          {status && (
            <div>
              <dt className="text-[var(--foreground)]/60">{t("status")}</dt>
              <dd className="capitalize">{status.replace(/_/g, " ")}</dd>
            </div>
          )}
          {pickup && (
            <div>
              <dt className="text-[var(--foreground)]/60">{t("pickup")}</dt>
              <dd>{pickup}</dd>
            </div>
          )}
          {delivery && (
            <div>
              <dt className="text-[var(--foreground)]/60">{t("delivery")}</dt>
              <dd>{delivery}</dd>
            </div>
          )}
        </dl>
        {(distanceKm != null || durationMinutes != null) && (
          <p className="mt-3 rounded-lg bg-[#0d2137]/[0.04] px-3 py-2 text-sm text-[var(--foreground)]/85">
            {distanceKm != null && (
              <span className="me-3">
                {t("approxDistance")}: <strong>{distanceKm} km</strong>
              </span>
            )}
            {durationMinutes != null && (
              <span>
                {t("approxDriveTime")}: <strong>{durationMinutes} min</strong>
              </span>
            )}
            <span className="mt-1 block text-xs text-[var(--foreground)]/55">{t("routeInfoHint")}</span>
          </p>
        )}
      </div>

      {(pickup || delivery) && (
        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-[var(--primary)]">{t("navTitle")}</h3>
          <p className="mb-3 text-sm text-[var(--foreground)]/75">{t("navIntro")}</p>
          <div className="flex flex-col gap-2">
            {pickup ? (
              <a
                href={mapsNavigateToDestination(pickup)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {t("navPickup")}
              </a>
            ) : null}
            {delivery ? (
              <a
                href={mapsNavigateToDestination(delivery)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-800"
              >
                {t("navDelivery")}
              </a>
            ) : null}
            {pickup && delivery ? (
              <a
                href={mapsRoutePickupToDelivery(pickup, delivery)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border-2 border-[#0d2137] bg-[#0d2137]/5 px-4 py-3 text-center text-sm font-semibold text-[#0d2137] hover:bg-[#0d2137]/10"
              >
                {t("navFullRoute")}
              </a>
            ) : null}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-950/90">
        <p className="font-medium">{t("privacyTitle")}</p>
        <p className="mt-1">{t("privacyBody")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {!sharing ? (
          <button
            type="button"
            onClick={startSharing}
            className="rounded-xl bg-[#0d2137] px-6 py-3.5 text-center font-semibold text-white shadow-sm hover:opacity-90"
          >
            {t("startButton")}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopSharing}
            className="rounded-xl border-2 border-red-300 bg-red-50 px-6 py-3.5 text-center font-semibold text-red-900 hover:bg-red-100"
          >
            {t("stopButton")}
          </button>
        )}
      </div>

      {msg && <p className="text-sm text-green-800">{msg}</p>}
      {err && sharing === false && <p className="text-sm text-red-700">{err}</p>}
      {lastSent && (
        <p className="text-xs text-[var(--foreground)]/60">
          {t("lastSent")}:{" "}
          {new Date(lastSent).toLocaleString(
            locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : `${locale}-${locale.toUpperCase()}`
          )}
        </p>
      )}

      <p className="text-xs text-[var(--foreground)]/50">{t("keepOpen")}</p>
    </div>
  );
}
