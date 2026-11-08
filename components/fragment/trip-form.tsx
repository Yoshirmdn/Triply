"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tripInputSchema, type TripInput } from "@/lib/validations/trip.schema";
import { TRIP_STATUSES, TRIP_STATUS_LABELS } from "@/data/trip";
import type { TripDTO } from "@/@type/trip";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20";

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      {children}
      {error ? <span className="block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function toDefaults(trip?: TripDTO): TripInput {
  if (!trip) {
    return {
      title: "",
      destination: "",
      description: "",
      startDate: "",
      endDate: "",
      travelers: 1,
      budget: 0,
      coverImage: "",
      status: "PLANNING",
    };
  }
  return {
    title: trip.title,
    destination: trip.destination,
    description: trip.description ?? "",
    startDate: trip.startDate,
    endDate: trip.endDate,
    travelers: trip.travelers,
    budget: Number(trip.budget),
    coverImage: trip.coverImage ?? "",
    status: trip.status,
  };
}

export function TripForm({ trip }: { trip?: TripDTO }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TripInput>({
    resolver: zodResolver(tripInputSchema),
    defaultValues: toDefaults(trip),
  });

  async function onSubmit(values: TripInput) {
    setServerError(null);
    const response = await fetch(trip ? `/api/v1/trips/${trip.id}` : "/api/v1/trips", {
      method: trip ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      setServerError(json?.error?.message ?? "Gagal menyimpan perjalanan");
      return;
    }
    router.push(`/dashboard/trips/${json.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6">
      {serverError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p> : null}

      <Field label="Judul perjalanan" error={errors.title?.message}>
        <input className={inputClass} placeholder="Liburan Akhir Tahun" {...register("title")} />
      </Field>

      <Field label="Destinasi" error={errors.destination?.message}>
        <input className={inputClass} placeholder="Yogyakarta, Indonesia" {...register("destination")} />
      </Field>

      <Field label="Deskripsi" error={errors.description?.message}>
        <textarea rows={3} className={inputClass} placeholder="Catatan singkat tentang perjalanan ini" {...register("description")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tanggal mulai" error={errors.startDate?.message}>
          <input type="date" className={inputClass} {...register("startDate")} />
        </Field>
        <Field label="Tanggal selesai" error={errors.endDate?.message}>
          <input type="date" className={inputClass} {...register("endDate")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Jumlah traveler" error={errors.travelers?.message}>
          <input type="number" min={1} className={inputClass} {...register("travelers", { valueAsNumber: true })} />
        </Field>
        <Field label="Estimasi budget (IDR)" error={errors.budget?.message}>
          <input type="number" min={0} step={1000} className={inputClass} {...register("budget", { valueAsNumber: true })} />
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <select className={inputClass} {...register("status")}>
            {TRIP_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TRIP_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="URL gambar sampul (opsional)" error={errors.coverImage?.message}>
        <input className={inputClass} placeholder="https://..." {...register("coverImage")} />
      </Field>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={trip ? `/dashboard/trips/${trip.id}` : "/dashboard/trips"}
          className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900 disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan..." : trip ? "Simpan perubahan" : "Buat perjalanan"}
        </button>
      </div>
    </form>
  );
}