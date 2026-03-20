"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
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
  pod_photo_url?: string | null;
  pod_completed_at?: string | null;
  delivery_complete?: boolean;
  has_live_location?: boolean;
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
  const [deliveryComplete, setDeliveryComplete] = useState(false);
  const [podPhotoUrl, setPodPhotoUrl] = useState<string | null>(null);
  const [podUploading, setPodUploading] = useState(false);
  const [podErr, setPodErr] = useState<string | null>(null);
  const [podOk, setPodOk] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  /** Server already has ≥1 GPS ping (customer can see driver on track page) */
  const [hasLiveLocationFromServer, setHasLiveLocationFromServer] = useState(false);
  const watchId = useRef<number | null>(null);
  const lastPostAt = useRef(0);

  const locationOkForPod = hasLiveLocationFromServer || lastSent != null;

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
        setHasLiveLocationFromServer(true);
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
        setDeliveryComplete(Boolean(data.delivery_complete));
        setPodPhotoUrl(data.pod_photo_url ?? null);
        setHasLiveLocationFromServer(Boolean(data.has_live_location));
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

  const onPickDeliveryPhoto = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !jobId || !token) return;
      if (!file.type.startsWith("image/")) {
        setPodErr(t("podNotImage"));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setPodErr(t("podTooLarge"));
        return;
      }
      setPodErr(null);
      setPodOk(null);
      setPodUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        void fetch("/api/public/driver-pod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: jobId,
            token,
            base64: dataUrl,
            filename: file.name,
            confirmation_code: confirmCode.trim() || undefined,
          }),
        })
          .then(async (res) => {
            const data = (await res.json()) as { error?: string; pod_photo_url?: string; already_completed?: boolean };
            if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : t("podUploadFailed"));
            return data;
          })
          .then((data) => {
            if (data.pod_photo_url) setPodPhotoUrl(data.pod_photo_url);
            setDeliveryComplete(true);
            setPodOk(data.already_completed ? t("podAlreadyDone") : t("podUploadOk"));
          })
          .catch((er) => setPodErr(er instanceof Error ? er.message : t("podUploadFailed")))
          .finally(() => setPodUploading(false));
      };
      reader.onerror = () => {
        setPodUploading(false);
        setPodErr(t("podReadFailed"));
      };
      reader.readAsDataURL(file);
    },
    [jobId, token, confirmCode, t]
  );

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
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-sm font-medium text-amber-950">
          {t("gpsMandatoryShort")}
        </p>
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

      <div className="rounded-xl border-2 border-[#b91c1c]/40 bg-red-50/50 p-5 shadow-sm">
        <h3 className="text-base font-bold text-[#7f1d1d]">{t("gpsMandatoryTitle")}</h3>
        <p className="mt-2 text-sm text-[#450a0a]/90">{t("gpsMandatoryBody")}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {!sharing ? (
            <button
              type="button"
              onClick={startSharing}
              className="rounded-xl bg-[#b91c1c] px-6 py-3.5 text-center font-semibold text-white shadow-sm hover:bg-[#991b1b]"
            >
              {t("startButton")}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopSharing}
              className="rounded-xl border-2 border-red-400 bg-white px-6 py-3.5 text-center font-semibold text-red-900 hover:bg-red-50"
            >
              {t("stopButton")}
            </button>
          )}
        </div>
        {locationOkForPod && (
          <p className="mt-3 text-sm font-semibold text-green-800">{t("gpsOkForCustomer")}</p>
        )}
        {msg && sharing && <p className="mt-2 text-sm text-green-800">{msg}</p>}
        {err && sharing === false && <p className="mt-2 text-sm text-red-700">{err}</p>}
        {lastSent && (
          <p className="mt-2 text-xs text-[var(--foreground)]/65">
            {t("lastSent")}:{" "}
            {new Date(lastSent).toLocaleString(
              locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : `${locale}-${locale.toUpperCase()}`
            )}
          </p>
        )}
        <p className="mt-2 text-xs text-[#450a0a]/80">{t("keepOpen")}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-950/90">
        <p className="font-medium">{t("privacyTitle")}</p>
        <p className="mt-1">{t("privacyBody")}</p>
      </div>

      <div
        className={`rounded-xl border-2 p-6 shadow-sm ${
          deliveryComplete
            ? "border-emerald-200 bg-emerald-50/40"
            : locationOkForPod
              ? "border-emerald-200 bg-emerald-50/40"
              : "border-slate-300 bg-slate-50/80"
        }`}
      >
        <h3 className="text-base font-semibold text-[var(--primary)]">{t("podTitle")}</h3>
        <p className="mt-2 text-sm text-[var(--foreground)]/80">{t("podIntro")}</p>
        {!deliveryComplete && !locationOkForPod && (
          <p className="mt-3 rounded-lg border border-amber-300 bg-amber-100/80 px-3 py-2 text-sm font-medium text-amber-950">
            {t("gpsRequiredBeforePod")}
          </p>
        )}
        {deliveryComplete ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-emerald-900">{t("podDone")}</p>
            {podPhotoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={podPhotoUrl}
                alt=""
                className="max-h-56 w-full max-w-md rounded-lg border border-emerald-200 object-contain"
              />
            ) : null}
          </div>
        ) : (
          <div className={`mt-4 space-y-3 ${!locationOkForPod ? "pointer-events-none opacity-55" : ""}`}>
            <label className="block text-xs font-medium text-[var(--foreground)]/70">{t("podCodeLabel")}</label>
            <input
              type="text"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder={t("podCodePlaceholder")}
              className="w-full max-w-md rounded-lg border-2 border-[#0d2137]/20 px-3 py-2 text-sm"
              maxLength={64}
              disabled={!locationOkForPod}
            />
            <div>
              <label
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white ${
                  locationOkForPod ? "cursor-pointer bg-[#0d2137] hover:opacity-90" : "cursor-not-allowed bg-slate-400"
                }`}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={podUploading || !locationOkForPod}
                  onChange={onPickDeliveryPhoto}
                />
                {podUploading ? t("podUploading") : t("podChoosePhoto")}
              </label>
            </div>
          </div>
        )}
        {podErr && <p className="mt-2 text-sm text-red-700">{podErr}</p>}
        {podOk && <p className="mt-2 text-sm text-green-800">{podOk}</p>}
      </div>
    </div>
  );
}
