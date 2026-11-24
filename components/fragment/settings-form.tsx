"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiClientError, apiPatch } from "@/lib/api-client";
import { accountFieldsSchema, type AccountFieldsInput } from "@/lib/validations/account.schema";
import { TRIP_PACES, TRIP_PACE_LABELS, TRIP_STYLES, TRIP_STYLE_HINTS, TRIP_STYLE_LABELS } from "@/data/generator";
import type { AccountDTO } from "@/@type/account";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20";

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-neutral-400">{hint}</span> : null}
      {error ? <span className="block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function SettingsForm({ account }: { account: AccountDTO }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AccountFieldsInput>({
    resolver: zodResolver(accountFieldsSchema),
    defaultValues: {
      name: account.name ?? "",
      defaultTravelers: account.defaultTravelers,
      defaultStyle: account.defaultStyle,
      defaultPace: account.defaultPace,
    },
  });

  const style = useWatch({ control, name: "defaultStyle" });

  async function onSubmit(values: AccountFieldsInput) {
    setMessage(null);
    try {
      const saved = await apiPatch<AccountDTO>("/account", values);
      reset({
        name: saved.name ?? "",
        defaultTravelers: saved.defaultTravelers,
        defaultStyle: saved.defaultStyle,
        defaultPace: saved.defaultPace,
      });
      setMessage({ tone: "ok", text: "Pengaturan tersimpan" });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof ApiClientError ? error.message : "Gagal menyimpan pengaturan" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6">
        <div>
          <h2 className="font-semibold text-neutral-900">Profil</h2>
          <p className="mt-1 text-sm text-neutral-500">Nama ini tampil ke anggota perjalanan dan di patungan.</p>
        </div>

        <div className="flex items-center gap-4">
          {account.image ? (
            <img src={account.image} alt="" className="size-14 rounded-full border border-neutral-200 object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full bg-teal-50 text-lg font-semibold text-teal-800">
              {(account.name ?? account.email).slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900">{account.email}</p>
            <p className="text-xs text-neutral-400">Email dan foto mengikuti akun Google dan tidak bisa diubah di sini.</p>
          </div>
        </div>

        <Field label="Nama" error={errors.name?.message}>
          <input className={inputClass} maxLength={80} {...register("name")} />
        </Field>
      </section>

      <section className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6">
        <div>
          <h2 className="font-semibold text-neutral-900">Preferensi default</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Dipakai sebagai isian awal saat membuat perjalanan dan menyusun itinerary otomatis. Selalu bisa diubah per perjalanan.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Jumlah traveler" error={errors.defaultTravelers?.message}>
            <input type="number" min={1} max={100} className={inputClass} {...register("defaultTravelers", { valueAsNumber: true })} />
          </Field>
          <Field label="Gaya trip" hint={TRIP_STYLE_HINTS[style]} error={errors.defaultStyle?.message}>
            <select className={inputClass} {...register("defaultStyle")}>
              {TRIP_STYLES.map((value) => (
                <option key={value} value={value}>
                  {TRIP_STYLE_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tempo" error={errors.defaultPace?.message}>
            <select className={inputClass} {...register("defaultPace")}>
              {TRIP_PACES.map((value) => (
                <option key={value} value={value}>
                  {TRIP_PACE_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <div className="flex items-center justify-end gap-4">
        {message ? <p className={message.tone === "ok" ? "text-sm text-teal-800" : "text-sm text-red-600"}>{message.text}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900 disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan pengaturan"}
        </button>
      </div>
    </form>
  );
}