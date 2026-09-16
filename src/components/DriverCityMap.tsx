"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

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

const PFORZHEIM: [number, number] = [48.8944, 8.7049];

const CITY_COORDS: Record<string, [number, number]> = {
  Pforzheim: [48.8944, 8.7049],
  Stuttgart: [48.7758, 9.1829],
  Karlsruhe: [49.0069, 8.4037],
  Mannheim: [49.4875, 8.466],
  Heidelberg: [49.3988, 8.6724],
};

const PLACEHOLDER_CITY = /^(sonstige|other|autre|altra|otra|altele|inne|__other__)$/i;

function Recenter({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 11);
  }, [map, lat, lng]);
  return (
    <Marker position={[lat, lng]}>
      <Popup>{label}</Popup>
    </Marker>
  );
}

export function DriverCityMap({ city }: { city: string }) {
  const trimmed = city.trim();
  const isPlaceholder = !trimmed || PLACEHOLDER_CITY.test(trimmed);
  const known = !isPlaceholder ? CITY_COORDS[trimmed] : undefined;
  const [geo, setGeo] = useState<{
    city: string;
    pos: [number, number];
    label: string;
  } | null>(null);

  useEffect(() => {
    if (isPlaceholder) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetch(`/api/geocode-city?q=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json())
        .then((d: { lat?: number | null; lon?: number | null; label?: string | null }) => {
          if (cancelled || d.lat == null || d.lon == null) return;
          setGeo({
            city: trimmed,
            pos: [d.lat, d.lon],
            label: d.label?.trim() || trimmed,
          });
        })
        .catch(() => {
          /* keep fallback */
        });
    }, known ? 0 : 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmed, isPlaceholder, known]);

  const position = (geo?.city === trimmed ? geo.pos : null) ?? known ?? PFORZHEIM;
  const markerLabel =
    (geo?.city === trimmed ? geo.label : null) ?? (trimmed && !isPlaceholder ? trimmed : "Pforzheim");

  return (
    <div className="h-[320px] w-full overflow-hidden rounded-xl border border-[#0d2137]/15 bg-[#f8f9fa]">
      <MapContainer center={position} zoom={11} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={position[0]} lng={position[1]} label={markerLabel} />
      </MapContainer>
    </div>
  );
}
