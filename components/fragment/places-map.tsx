"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, CircleMarker, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PlaceDTO } from "@/@type/place";

type PlacesMapProps = {
  center: { latitude: number; longitude: number } | null;
  places: PlaceDTO[];
  activeId: string | null;
  onSelect?: (placeId: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
};

const DEFAULT_CENTER: [number, number] = [-2.5, 118];
const DEFAULT_ZOOM = 4;

export function PlacesMap({ center, places, activeId, onSelect, userLocation }: PlacesMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef<Map<string, CircleMarker>>(new Map());
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    let cancelled = false;
    const markers = markersRef.current;

    async function init() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 0);
    }

    void init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      markers.clear();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      const L = leafletRef.current ?? (await import("leaflet"));
      if (cancelled) return;

      const waitForMap = () =>
        new Promise<void>((resolve) => {
          const check = () => (mapRef.current && layerRef.current ? resolve() : setTimeout(check, 50));
          check();
        });
      await waitForMap();
      if (cancelled || !mapRef.current || !layerRef.current) return;

      const map = mapRef.current;
      const layer = layerRef.current;
      layer.clearLayers();
      markersRef.current.clear();

      const bounds: [number, number][] = [];

      if (center) {
        L.circleMarker([center.latitude, center.longitude], {
          radius: 6,
          color: "#1e3a8a",
          weight: 2,
          fillColor: "#ffffff",
          fillOpacity: 1,
        })
          .bindTooltip("Pusat pencarian")
          .addTo(layer);
        bounds.push([center.latitude, center.longitude]);
      }

      if (userLocation) {
        L.circleMarker([userLocation.latitude, userLocation.longitude], {
          radius: 8,
          color: "#ffffff",
          weight: 3,
          fillColor: "#2563eb",
          fillOpacity: 1,
        })
          .bindTooltip("Lokasi kamu")
          .addTo(layer);
        bounds.push([userLocation.latitude, userLocation.longitude]);
      }

      for (const place of places) {
        const marker = L.circleMarker([place.latitude, place.longitude], {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: "#115e59",
          fillOpacity: 0.95,
        });
        marker.bindPopup(
          `<strong>${escapeHtml(place.name)}</strong>${place.address ? `<br/><span>${escapeHtml(place.address)}</span>` : ""}`,
        );
        marker.on("click", () => onSelectRef.current?.(place.placeId));
        marker.addTo(layer);
        markersRef.current.set(place.placeId, marker);
        bounds.push([place.latitude, place.longitude]);
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      }
    }

    void draw();
    return () => {
      cancelled = true;
    };
  }, [center, places, userLocation]);

  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const active = id === activeId;
      marker.setStyle({ fillColor: active ? "#f59e0b" : "#115e59", radius: active ? 11 : 8 });
      if (active) {
        marker.bringToFront();
        marker.openPopup();
      }
    });
  }, [activeId]);

  return <div ref={containerRef} className="h-full w-full rounded-xl border border-neutral-200" />;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char];
  });
}