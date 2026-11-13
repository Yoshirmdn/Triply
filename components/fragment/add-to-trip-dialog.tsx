"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { ApiClientError, apiGet, apiPost } from "@/lib/api-client";
import { formatDateID } from "@/utils/date";
import type { PlaceInput } from "@/lib/validations/place.schema";
import type { TripDTO, TripDayDTO } from "@/@type/trip";

type AddToTripDialogProps = {
  place: PlaceInput;
};

export function AddToTripDialog({ place }: AddToTripDialogProps) {
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState<TripDTO[]>([]);
  const [days, setDays] = useState<TripDayDTO[]>([]);
  const [tripId, setTripId] = useState("");
  const [dayId, setDayId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const tripsRequest = useRef<AbortController | null>(null);
  const daysRequest = useRef<AbortController | null>(null);

  async function loadTrips() {
    tripsRequest.current?.abort();
    const controller = new AbortController();
    tripsRequest.current = controller;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<TripDTO[]>("/trips?pageSize=100", { signal: controller.signal });
      setTrips(data.filter((trip) => trip.canEdit));
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof ApiClientError ? err.message : "Gagal memuat perjalanan");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  async function selectTrip(id: string) {
    daysRequest.current?.abort();
    setTripId(id);
    setDays([]);
    setDayId("");
    if (!id) return;
    const controller = new AbortController();
    daysRequest.current = controller;
    try {
      const data = await apiGet<TripDayDTO[]>(`/trips/${id}/days`, { signal: controller.signal });
      setDays(data);
      setDayId(data[0]?.id ?? "");
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof ApiClientError ? err.message : "Gagal memuat hari");
    }
  }

  function openDialog() {
    setOpen(true);
    void loadTrips();
  }

  function close() {
    setOpen(false);
    setDone(false);
    setError(null);
    setTripId("");
    setDays([]);
    setDayId("");
    tripsRequest.current?.abort();
    daysRequest.current?.abort();
  }

  async function submit() {
    if (!tripId || !dayId) return;
    setSaving(true);
    setError(null);
    try {
      await apiPost(`/trips/${tripId}/itinerary`, { tripDayId: dayId, place });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Gagal menambahkan ke itinerary");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-900"
      >
        <Plus className="size-4" />
        Tambah ke itinerary
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-neutral-900">Tambah ke itinerary</h2>
                <p className="mt-0.5 line-clamp-1 text-sm text-neutral-500">{place.name}</p>
              </div>
              <button type="button" onClick={close} aria-label="Tutup" className="text-neutral-400 hover:text-neutral-900">
                <X className="size-5" />
              </button>
            </div>

            {done ? (
              <div className="space-y-4">
                <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">Tempat berhasil ditambahkan.</p>
                <button
                  type="button"
                  onClick={close}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {loading ? <p className="text-sm text-neutral-500">Memuat perjalanan...</p> : null}
                {!loading && trips.length === 0 && !error ? (
                  <p className="text-sm text-neutral-500">Belum ada perjalanan yang bisa diedit. Buat perjalanan dulu.</p>
                ) : null}

                {trips.length > 0 ? (
                  <div className="space-y-3">
                    <label className="block space-y-1 text-sm">
                      <span className="font-medium text-neutral-800">Perjalanan</span>
                      <select
                        value={tripId}
                        onChange={(event) => void selectTrip(event.target.value)}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2"
                      >
                        <option value="">Pilih perjalanan</option>
                        {trips.map((trip) => (
                          <option key={trip.id} value={trip.id}>
                            {trip.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1 text-sm">
                      <span className="font-medium text-neutral-800">Hari</span>
                      <select
                        value={dayId}
                        onChange={(event) => setDayId(event.target.value)}
                        disabled={!tripId}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 disabled:bg-neutral-100"
                      >
                        {days.map((day) => (
                          <option key={day.id} value={day.id}>
                            Hari {day.dayNumber} · {formatDateID(day.date)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                  type="button"
                  onClick={submit}
                  disabled={!tripId || !dayId || saving}
                  className="w-full rounded-lg bg-teal-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-900 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Tambahkan"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}