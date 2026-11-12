"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteDTO } from "@/@type/itinerary";

type MapStop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

type ItineraryMapProps = {
  stops: MapStop[];
  route: RouteDTO | null;
};

const DEFAULT_CENTER: [number, number] = [-2.5, 118];

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char];
  });
}

export function ItineraryMap({ stops, route }: ItineraryMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const [map, setMap] = useState<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    let instance: LeafletMap | null = null;

    async function init() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;

      instance = L.map(containerRef.current).setView(DEFAULT_CENTER, 4);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(instance);
      layerRef.current = L.layerGroup().addTo(instance);
      setMap(instance);
      setTimeout(() => instance?.invalidateSize(), 0);
    }

    void init();

    return () => {
      cancelled = true;
      instance?.remove();
      layerRef.current = null;
      setMap(null);
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const layer = layerRef.current;
    if (!map || !L || !layer) return;

    layer.clearLayers();
    const bounds: [number, number][] = [];

    if (route && route.line.length > 0) {
      for (const line of route.line) {
        L.polyline(line, { color: "#0f766e", weight: 5, opacity: 0.85 }).addTo(layer);
        for (const point of line) bounds.push(point);
      }
    } else if (stops.length > 1) {
      L.polyline(
        stops.map((stop) => [stop.latitude, stop.longitude] as [number, number]),
        { color: "#0f766e", weight: 3, opacity: 0.6, dashArray: "6 8" },
      ).addTo(layer);
    }

    stops.forEach((stop, index) => {
      const icon = L.divIcon({
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        html: `<div style="width:28px;height:28px;border-radius:9999px;background:#115e59;color:#fff;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font:600 12px system-ui,sans-serif">${index + 1}</div>`,
      });
      L.marker([stop.latitude, stop.longitude], { icon })
        .bindPopup(`<strong>${index + 1}. ${escapeHtml(stop.name)}</strong>`)
        .addTo(layer);
      bounds.push([stop.latitude, stop.longitude]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  }, [map, stops, route]);

  return <div ref={containerRef} className="h-full w-full rounded-xl border border-neutral-200" />;
}