"use client";

import { useMemo, useState } from "react";
import { Clock, MapPin } from "lucide-react";
import { ItineraryMap } from "@/components/fragment/itinerary-map";
import { PLACE_CATEGORY_LABELS } from "@/data/places";
import { formatLongDateID } from "@/utils/date";
import { cn } from "@/lib/utils";
import type { PublicDayDTO } from "@/@type/share";

export function PublicTripView({ days }: { days: PublicDayDTO[] }) {
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const stops = useMemo(() => {
    const source = activeDay
      ? days.filter((day) => day.id === activeDay)
      : days;
    return source.flatMap((day) =>
      day.items.flatMap((item) =>
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
    );
  }, [days, activeDay]);

  const visibleDays = activeDay
    ? days.filter((day) => day.id === activeDay)
    : days;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveDay(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium",
              activeDay === null
                ? "border-teal-800 bg-teal-800 text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50",
            )}
          >
            Semua hari
          </button>
          {days.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => setActiveDay(day.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium",
                activeDay === day.id
                  ? "border-teal-800 bg-teal-800 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50",
              )}
            >
              Hari {day.dayNumber}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {visibleDays.map((day) => (
            <section key={day.id} className="space-y-3">
              <div>
                <h2 className="font-semibold text-neutral-900">
                  Hari {day.dayNumber}
                </h2>
                <p className="text-sm text-neutral-500">
                  {formatLongDateID(day.date)}
                </p>
              </div>
              {day.items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-6 text-center text-sm text-neutral-500">
                  Belum ada rencana untuk hari ini.
                </p>
              ) : (
                <ol className="space-y-2">
                  {day.items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-neutral-200 bg-white p-4"
                    >
                      <p className="font-medium text-neutral-900">
                        {item.place?.name ?? item.title ?? "Tanpa judul"}
                      </p>
                      {item.place?.address ? (
                        <p className="mt-1 flex items-start gap-1.5 text-sm text-neutral-500">
                          <MapPin className="mt-0.5 size-3.5 shrink-0" />
                          {item.place.address}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                        {item.place ? (
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5">
                            {PLACE_CATEGORY_LABELS[item.place.category]}
                          </span>
                        ) : null}
                        {item.startTime ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" />
                            {item.startTime}
                            {item.endTime ? ` – ${item.endTime}` : ""}
                          </span>
                        ) : null}
                      </div>
                      {item.notes ? (
                        <p className="mt-2 whitespace-pre-line text-sm text-neutral-600">
                          {item.notes}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>
      </div>

      <div className="h-80 lg:sticky lg:top-24 lg:h-[32rem]">
        <ItineraryMap stops={stops} route={null} />
      </div>
    </div>
  );
}
