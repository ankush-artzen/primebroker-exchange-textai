"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: L.LatLngExpression = [28.6139, 77.209];

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Props {
  lat: number | null;
  lon: number | null;
  onPick: (lat: number, lon: number) => void;
}

export function LocationPickerMap({ lat, lon, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  const coordsRef = useRef({ lat, lon });

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    coordsRef.current = { lat, lon };
  }, [lat, lon]);

  const syncMarker = (nextLat: number, nextLon: number) => {
    const map = mapRef.current;
    if (!map) return;

    map.setView([nextLat, nextLon], 15, { animate: true });

    if (markerRef.current) {
      markerRef.current.setLatLng([nextLat, nextLon]);
      return;
    }

    markerRef.current = L.marker([nextLat, nextLon], {
      icon: markerIcon,
      draggable: true,
    }).addTo(map);

    markerRef.current.on("dragend", () => {
      const pos = markerRef.current?.getLatLng();
      if (pos) onPickRef.current(pos.lat, pos.lng);
    });
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initial = coordsRef.current;

    const map = L.map(containerRef.current, {
      center:
        initial.lat != null && initial.lon != null
          ? [initial.lat, initial.lon]
          : DEFAULT_CENTER,
      zoom: initial.lat != null && initial.lon != null ? 15 : 11,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (event) => {
      syncMarker(event.latlng.lat, event.latlng.lng);
      onPickRef.current(event.latlng.lat, event.latlng.lng);
    });

    mapRef.current = map;

    if (initial.lat != null && initial.lon != null) {
      syncMarker(initial.lat, initial.lon);
    }

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
      const current = coordsRef.current;
      if (current.lat != null && current.lon != null) {
        syncMarker(current.lat, current.lon);
      }
    }, 150);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (lat == null || lon == null) return;
    syncMarker(lat, lon);
  }, [lat, lon]);

  return (
    <div
      ref={containerRef}
      className="h-52 w-full overflow-hidden rounded-xl border border-border md:h-64"
    />
  );
}
