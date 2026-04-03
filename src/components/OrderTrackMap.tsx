"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/** Safe URL for HTML img src + Leaflet divIcon */
function sanitizeMarkerPhotoUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;");
}

/** Live driver avatar on track map — size matches `.leaflet-driver-photo-marker__inner` in globals.css */
const DRIVER_PHOTO_MARKER_PX = 64;

function createDriverPhotoDivIcon(href: string): L.DivIcon {
  const safe = escapeAttr(href);
  const s = DRIVER_PHOTO_MARKER_PX;
  const half = s / 2;
  return L.divIcon({
    className: "leaflet-driver-photo-marker",
    html: `<div class="leaflet-driver-photo-marker__inner"><img src="${safe}" alt="" decoding="async" fetchpriority="high" /></div>`,
    iconSize: [s, s],
    iconAnchor: [half, s],
    popupAnchor: [0, -(s - 8)],
  });
}

/** Visible live-driver marker when there is no profile photo (distinct from blue pickup/delivery pins). */
function createDriverGpsFallbackDivIcon(): L.DivIcon {
  const s = DRIVER_PHOTO_MARKER_PX;
  const half = s / 2;
  return L.divIcon({
    className: "leaflet-driver-photo-marker",
    html: `<div class="leaflet-driver-photo-marker__inner leaflet-driver-gps-fallback__inner" title="" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5" fill="white" stroke="none"/></svg>
    </div>`,
    iconSize: [s, s],
    iconAnchor: [half, s],
    popupAnchor: [0, -(s - 8)],
  });
}

if (typeof window !== "undefined") {
  const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
  L.Marker.prototype.options.icon = DefaultIcon;
}

type LatLng = { lat: number; lng: number };

function FitSmart({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
    } else {
      const ll = points.map((p) => L.latLng(p.lat, p.lng));
      map.fitBounds(L.latLngBounds(ll), { padding: [48, 48], maxZoom: 14 });
    }
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map, points]);
  return null;
}

export type TrailPointMap = { lat: number; lng: number; recorded_at: string };

export function OrderTrackMap({
  pickup,
  delivery,
  routeLine,
  livePosition,
  liveMarkerPhotoUrl,
  trail = [],
  pickupLabel,
  deliveryLabel,
  liveLabel,
}: {
  pickup?: LatLng | null;
  delivery?: LatLng | null;
  routeLine?: GeoJSON.LineString | null;
  livePosition?: LatLng | null;
  liveMarkerPhotoUrl?: string | null;
  trail?: TrailPointMap[];
  pickupLabel?: string;
  deliveryLabel?: string;
  liveLabel?: string;
}) {
  const trailLinePositions = useMemo(() => {
    const chronological = [...trail].reverse();
    return chronological
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => [p.lat, p.lng] as [number, number]);
  }, [trail]);

  const routePositions = useMemo((): [number, number][] | null => {
    if (!routeLine?.coordinates?.length) return null;
    return routeLine.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
  }, [routeLine]);

  const boundsPoints = useMemo(() => {
    const pts: LatLng[] = [];
    if (pickup) pts.push(pickup);
    if (delivery) pts.push(delivery);
    if (livePosition) pts.push(livePosition);
    for (const [lat, lng] of trailLinePositions) pts.push({ lat, lng });
    return pts;
  }, [pickup, delivery, livePosition, trailLinePositions]);

  const center: [number, number] = useMemo(() => {
    if (boundsPoints.length === 0) return [48.893_2, 8.691_9];
    const s = boundsPoints.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), {
      lat: 0,
      lng: 0,
    });
    return [s.lat / boundsPoints.length, s.lng / boundsPoints.length];
  }, [boundsPoints]);

  const liveIcon = useMemo(() => {
    const href = sanitizeMarkerPhotoUrl(liveMarkerPhotoUrl);
    if (href) return createDriverPhotoDivIcon(href);
    return createDriverGpsFallbackDivIcon();
  }, [liveMarkerPhotoUrl]);

  if (boundsPoints.length === 0) return null;

  return (
    <div className="h-[min(420px,58vh)] min-h-[300px] w-full overflow-hidden rounded-xl border border-[#0d2137]/10 bg-white shadow-sm">
      <MapContainer center={center} zoom={9} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitSmart points={boundsPoints} />
        {routePositions && routePositions.length >= 2 && (
          <Polyline
            positions={routePositions}
            pathOptions={{ color: "#64748b", weight: 4, opacity: 0.75, dashArray: "10 8" }}
          />
        )}
        {trailLinePositions.length >= 2 && (
          <Polyline positions={trailLinePositions} pathOptions={{ color: "#e85d04", weight: 5, opacity: 0.9 }} />
        )}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]}>
            <Popup>{pickupLabel ?? "Pickup / Abholung"}</Popup>
          </Marker>
        )}
        {delivery && (
          <Marker position={[delivery.lat, delivery.lng]}>
            <Popup>{deliveryLabel ?? "Delivery / Lieferung"}</Popup>
          </Marker>
        )}
        {livePosition && liveIcon && (
          <Marker position={[livePosition.lat, livePosition.lng]} zIndexOffset={2000} icon={liveIcon}>
            <Popup>{liveLabel ?? "Live position"}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
