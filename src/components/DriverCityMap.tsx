"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix default marker in Next.js
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

const PFORZHEIM: [number, number] = [49.0, 8.7];

function FitView() {
  const map = useMap();
  useEffect(() => {
    map.setView(PFORZHEIM, 10);
  }, [map]);
  return null;
}

export function DriverCityMap() {
  return (
    <div className="h-[320px] w-full overflow-hidden rounded-xl border border-[#0d2137]/15 bg-[#f8f9fa]">
      <MapContainer
        center={PFORZHEIM}
        zoom={10}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitView />
        <Marker position={PFORZHEIM}>
          <Popup>Pforzheim – Einsatzgebiet</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
