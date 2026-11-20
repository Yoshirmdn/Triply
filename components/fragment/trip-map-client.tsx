"use client";

import { useEffect, useMemo, useState } from "react";
import { ItineraryMap } from "@/components/fragment/itinerary-map";
import { WeatherBadge } from "@/components/element/weather-badge";
import { ApiClientError, apiGet } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { PLACE_CATEGORY_LABELS } from "@/data/places";
import {
  ROUTE_MODES,
  ROUTE_MODE_LABELS,
  type RouteMode,
} from "@/data/itinerary";
import { formatIDR } from "@/utils/format";
import { formatDateID } from "@/utils/date";
import type { ItineraryItemDTO } from "@/@type/place";
import type { RouteDTO } from "@/@type/itinerary";
import type { DayInsightDTO } from "@/@type/trip-extra";

type DayOption = { id: string; dayNumber: number; date: string };

type TripMapClientProps = {
  tripId: string;
  days: DayOption[];
  items: ItineraryItemDTO[];
  insights: DayInsightDTO[];
};

type RouteResult = {
  key: string;
  route: RouteDTO | null;
  error: string | null;
};

function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} menit`;
  return `${Math.floor(minutes / 60)} jam ${minutes % 60} menit`;
}

export function TripMapClient({
  tripId,
  days,
  items,
  insights,
}: TripMapClientProps) {
  const [selected, setSelected] = useState<string>("ALL");
  const [mode, setMode] = useState<RouteMode>("drive");
  const [result, setResult] = useState<RouteResult | null>(null);

  const dayById = useMemo(
    () => new Map(days.map((day) => [day.id, day])),
    [days],
  );
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          item.place && (selected === "ALL" || item.tripDayId === selected),
      ),
    [items, selected],
  );
  const stops = useMemo(
    () =>
      visible.flatMap((item) =>
        item.place
          ? [
              {
                id: item.id,
                name: item.place.name,
                latitude: item.place.latitude,
                longitude: item.place.longitude,
              },
            ]
          : [],
      ),
    [visible],
  );

  const insight = insights.find((entry) => entry.dayId === selected) ?? null;
  const routeKey =
    selected === "ALL" || stops.length < 2
      ? null
      : `${selected}|${mode}|${stops.map((stop) => stop.id).join(",")}`;

  useEffect(() => {
    if (!routeKey) return;
    const controller = new AbortController();
    apiGet<RouteDTO>(`/trips/${tripId}/route?dayId=${selected}&mode=${mode}`, {
      signal: controller.signal,
    })
      .then((route) => setResult({ key: routeKey, route, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          key: routeKey,
          route: null,
          error:
            err instanceof ApiClientError ? err.message : "Gagal memuat rute",
        });
      });
    return () => controller.abort();
  }, [routeKey, tripId, selected, mode]);

  const current = routeKey && result?.key === routeKey ? result : null;
  const loading = routeKey !== null && current === null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelected("ALL")}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition",
            selected === "ALL"
              ? "border-teal-800 bg-teal-800 text-white"
              : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
          )}
        >
          Semua hari
        </button>
        {days.map((day) => (
          <button
            key={day.id}
            type="button"
            onClick={() => setSelected(day.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition",
              selected === day.id
                ? "border-teal-800 bg-teal-800 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
            )}
          >
            Hari {day.dayNumber}
          </button>
        ))}
      </div>

      {insight ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm">
          <span className="font-medium text-neutral-900">
            {formatDateID(insight.date)}
          </span>
          {insight.weather ? (
            <WeatherBadge weather={insight.weather} />
          ) : (
            <span className="text-neutral-400">
              Prakiraan cuaca belum tersedia
            </span>
          )}
          <span className="text-neutral-600">
            Estimasi biaya tempat:{" "}
            <strong className="text-neutral-900">
              {insight.cost > 0
                ? formatIDR(insight.cost)
                : "belum ada data harga"}
            </strong>
            {insight.unpricedCount > 0 ? (
              <span className="text-neutral-400">
                {" "}
                ({insight.unpricedCount} tempat tanpa data harga)
              </span>
            ) : null}
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="order-2 space-y-3 lg:order-1">
          {selected !== "ALL" ? (
            <div className="flex flex-wrap gap-2">
              {ROUTE_MODES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs transition",
                    mode === value
                      ? "border-teal-800 bg-teal-50 text-teal-900"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300",
                  )}
                >
                  {ROUTE_MODE_LABELS[value]}
                </button>
              ))}
            </div>
          ) : null}

          {visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
              Belum ada tempat di itinerary.
            </div>
          ) : (
            <ol className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
              {visible.map((item, index) => (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-800 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {item.place?.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {selected === "ALL"
                        ? `Hari ${dayById.get(item.tripDayId)?.dayNumber ?? "-"} · `
                        : ""}
                      {item.startTime ? `${item.startTime} · ` : ""}
                      {item.place
                        ? PLACE_CATEGORY_LABELS[item.place.category]
                        : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {selected !== "ALL" ? (
            <p className="text-sm text-neutral-600">
              {stops.length < 2 ? (
                "Tambahkan minimal dua tempat untuk melihat rute."
              ) : loading ? (
                "Memuat rute..."
              ) : current?.error ? (
                <span className="text-red-600">{current.error}</span>
              ) : current?.route ? (
                <>
                  Total{" "}
                  <strong>{formatDistance(current.route.distance)}</strong> ·{" "}
                  <strong>{formatDuration(current.route.time)}</strong>
                </>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="order-1 h-96 lg:order-2 lg:col-span-2 lg:h-[70vh]">
          <ItineraryMap
            stops={stops}
            route={current?.route ?? null}
            connect={selected !== "ALL"}
          />
        </div>
      </div>

      <p className="text-right text-xs text-neutral-400">
        Cuaca oleh Open-Meteo · Rute oleh Geoapify · © OpenStreetMap
        contributors
      </p>
    </div>
  );
}
