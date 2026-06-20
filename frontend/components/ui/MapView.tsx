"use client";

import { useEffect, type ReactNode } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MarkerKind = "user" | "origin" | "destination" | "stationAvailable" | "stationBusy";

const MARKER_COLORS: Record<MarkerKind, string> = {
  user: "#16a34a",
  origin: "#16a34a",
  destination: "#dc2626",
  stationAvailable: "#16a34a",
  stationBusy: "#64748b",
};

function dotIcon(kind: MarkerKind) {
  const color = MARKER_COLORS[kind];
  const size = kind === "user" ? 16 : 13;
  return L.divIcon({
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.85);box-shadow:0 0 8px ${color}"></span>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export interface MapMarker {
  position: [number, number];
  kind: MarkerKind;
  popup?: ReactNode;
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 13);
    } else {
      map.fitBounds(positions as L.LatLngBoundsLiteral, { padding: [32, 32] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(positions)]);
  return null;
}

interface MapViewProps {
  markers: MapMarker[];
  polyline?: [number, number][];
  className?: string;
  height?: number | string;
}

export function MapView({ markers, polyline, className, height = 320 }: MapViewProps) {
  const positions = markers.map((m) => m.position);
  const fallbackCenter: [number, number] = positions[0] ?? [11.0, 78.0];

  return (
    <div className={className} style={{ height }}>
      <MapContainer
        center={fallbackCenter}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full rounded-xl"
        style={{ background: "#f0f4f2" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {polyline && polyline.length > 1 && (
          <Polyline positions={polyline} pathOptions={{ color: "#16a34a", weight: 4 }} />
        )}
        {markers.map((m, i) => (
          <Marker key={i} position={m.position} icon={dotIcon(m.kind)}>
            {m.popup && <Popup>{m.popup}</Popup>}
          </Marker>
        ))}
        <FitBounds positions={positions} />
      </MapContainer>
    </div>
  );
}
