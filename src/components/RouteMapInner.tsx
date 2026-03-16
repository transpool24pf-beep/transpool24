"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in Next.js (webpack doesn't resolve leaflet images)
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

type RouteMapInnerProps = {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  geometry: GeoJSON.LineString | null;
  distanceKm?: number;
};

function FitBounds({ from, to }: { from: { lat: number; lon: number }; to: { lat: number; lon: number } }) {
  const map = useMap();
  const fromLatLng: [number, number] = [from.lat, from.lon];
  const toLatLng: [number, number] = [to.lat, to.lon];
  useEffect(() => {
    map.fitBounds(L.latLngBounds(fromLatLng, toLatLng), { padding: [40, 40], maxZoom: 10 });
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(t);
  }, [map, from.lat, from.lon, to.lat, to.lon]);
  return null;
}

export function RouteMapInner({ from, to, geometry, distanceKm }: RouteMapInnerProps) {
  const fromLatLng: [number, number] = [from.lat, from.lon];
  const toLatLng: [number, number] = [to.lat, to.lon];

  return (
    <div className="h-[280px] w-full overflow-hidden rounded-lg border border-[#0d2137]/20">
      <MapContainer
        center={[(from.lat + to.lat) / 2, (from.lon + to.lon) / 2]}
        zoom={6}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds from={from} to={to} />
        {geometry && (
          <GeoJSON
            key={JSON.stringify(geometry)}
            data={geometry as GeoJSON.GeoJsonObject}
            style={{ color: "#0d2137", weight: 4, opacity: 0.8 }}
          />
        )}
        <Marker position={fromLatLng}>
          <Popup>A – Pickup</Popup>
        </Marker>
        <Marker position={toLatLng}>
          <Popup>B – Delivery</Popup>
        </Marker>
      </MapContainer>
      {distanceKm != null && (
        <p className="mt-2 text-center text-sm font-medium text-[var(--foreground)]">
          {distanceKm} km
        </p>
      )}
    </div>
  );
}
