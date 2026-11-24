"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { ApiClientError, apiPost } from "@/lib/api-client";
import {
  TRIP_PACES,
  TRIP_PACE_LABELS,
  PACE_ACTIVITIES,
  TRIP_STYLES,
  TRIP_STYLE_HINTS,
  TRIP_STYLE_LABELS,
  type TripPaceValue,
  type TripStyleValue,
} from "@/data/generator";
import { SEARCH_RADIUS_OPTIONS, DEFAULT_SEARCH_RADIUS, PLACE_CATEGORY_LABELS } from "@/data/places";
import { cn } from "@/lib/utils";
import type { GeneratedPlanDTO } from "@/@type/generator";

type AutoPlanDialogProps = {
  tripId: string;
  hasItems: boolean;
  defaultStyle?: TripStyleValue;
  defaultPace?: TripPaceValue;
};

export function AutoPlanDialog({ tripId, hasItems, defaultStyle = "BALANCED", defaultPace = "NORMAL" }: AutoPlanDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<TripStyleValue>(defaultStyle);
  const [pace, setPace] = useState<TripPaceValue>(defaultPace);
  const [radius, setRadius] = useState<number>(DEFAULT_SEARCH_RADIUS);
  const [replace, setReplace] = useState(true);
  const [plan, setPlan] = useState<GeneratedPlanDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setPlan(null);
    setError(null);
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost<GeneratedPlanDTO>(`/trips/${tripId}/generate`, { style, pace, radius });
      setPlan(result);
    } catch (err) {
      setPlan(null);
      setError(err instanceof ApiClientError ? err.message : "Gagal membuat rencana");
    } finally {
      setLoading(false);
    }
  }

  async function apply() {
    if (!plan) return;
    setSaving(true);
    setError(null);
    try {
      await apiPost(`/trips/${tripId}/generate/apply`, {
        replace: hasItems ? replace : false,
        days: plan.days.map((day) => ({
          dayNumber: day.dayNumber,
          items: day.items.map((item) => ({
            place: {
              placeId: item.place.placeId,
              name: item.place.name,
              address: item.place.address,
              latitude: item.place.latitude,
              longitude: item.place.longitude,
              category: item.place.category,
            },
            startTime: item.startTime,
            endTime: item.endTime,
            notes: item.notes,
          })),
        })),
      });
      close();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Gagal menyimpan rencana");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900"
      >
        <Sparkles className="size-4" />
        Buat otomatis
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-6">
              <div>
                <h2 className="font-semibold text-neutral-900">Buat itinerary otomatis</h2>
                <p className="mt-0.5 text-sm text-neutral-500">
                  Tempat dipilih dari sekitar destinasi, dikelompokkan per hari berdasarkan jarak.
                </p>
              </div>
              <button type="button" onClick={close} aria-label="Tutup" className="text-neutral-400 hover:text-neutral-900">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto p-6">
              {plan ? (
                <div className="space-y-4">
                  {plan.used < plan.requested ? (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      Hanya {plan.used} dari {plan.requested} tempat wisata yang ditemukan di sekitar sini. Coba perluas jangkauan.
                    </p>
                  ) : null}
                  {plan.days.map((day) => (
                    <div key={day.dayNumber} className="rounded-lg border border-neutral-200">
                      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-sm">
                        <span className="font-medium text-neutral-900">Hari {day.dayNumber}</span>
                        <span className="text-neutral-500">
                          {day.items.length} tempat{day.distanceKm > 0 ? ` · ±${day.distanceKm} km` : ""}
                        </span>
                      </div>
                      {day.items.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-neutral-400">Tidak ada tempat untuk hari ini.</p>
                      ) : (
                        <ul className="divide-y divide-neutral-100">
                          {day.items.map((item) => (
                            <li key={`${day.dayNumber}-${item.place.placeId}`} className="flex items-baseline gap-3 px-4 py-2 text-sm">
                              <span className="w-24 shrink-0 text-neutral-500">
                                {item.startTime}–{item.endTime}
                              </span>
                              <span className="min-w-0 flex-1 truncate font-medium text-neutral-900">{item.place.name}</span>
                              <span className="shrink-0 text-xs text-neutral-400">
                                {item.notes ?? PLACE_CATEGORY_LABELS[item.place.category]}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}

                  {hasItems ? (
                    <fieldset className="space-y-2 rounded-lg border border-neutral-200 p-4 text-sm">
                      <legend className="px-1 font-medium text-neutral-800">Itinerary yang sudah ada</legend>
                      <label className="flex items-center gap-2">
                        <input type="radio" checked={replace} onChange={() => setReplace(true)} />
                        Ganti dengan rencana ini
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" checked={!replace} onChange={() => setReplace(false)} />
                        Tambahkan setelah yang sudah ada
                      </label>
                    </fieldset>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-800">Gaya perjalanan</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {TRIP_STYLES.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setStyle(value)}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-left text-sm transition",
                            style === value ? "border-teal-700 bg-teal-50" : "border-neutral-200 hover:bg-neutral-50",
                          )}
                        >
                          <span className="block font-medium text-neutral-900">{TRIP_STYLE_LABELS[value]}</span>
                          <span className="block text-xs text-neutral-500">{TRIP_STYLE_HINTS[value]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-800">Tempo</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {TRIP_PACES.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPace(value)}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-left text-sm transition",
                            pace === value ? "border-teal-700 bg-teal-50" : "border-neutral-200 hover:bg-neutral-50",
                          )}
                        >
                          <span className="block font-medium text-neutral-900">{TRIP_PACE_LABELS[value]}</span>
                          <span className="block text-xs text-neutral-500">{PACE_ACTIVITIES[value]} tempat wisata per hari</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block space-y-1 text-sm">
                    <span className="font-medium text-neutral-800">Jangkauan dari pusat destinasi</span>
                    <select
                      value={radius}
                      onChange={(event) => setRadius(Number(event.target.value))}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2"
                    >
                      {SEARCH_RADIUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-200 p-4">
              {plan ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPlan(null)}
                    disabled={saving}
                    className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Ubah pilihan
                  </button>
                  <button
                    type="button"
                    onClick={() => void apply()}
                    disabled={saving}
                    className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
                  >
                    {saving ? "Menyimpan..." : "Terapkan ke itinerary"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => void generate()}
                    disabled={loading}
                    className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
                  >
                    {loading ? "Menyusun rencana..." : "Buat rencana"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}