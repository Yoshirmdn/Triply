"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { formatIDR } from "@/utils/format";

type UseTemplateButtonProps = {
  templateId: string;
  title: string;
  days: number;
  dailyBudget: number;
  defaultOpen?: boolean;
};

function defaultStartDate(): string {
  const date = new Date(Date.now() + 14 * 86_400_000);
  return date.toISOString().slice(0, 10);
}

export function UseTemplateButton({
  templateId,
  title,
  days,
  dailyBudget,
  defaultOpen = false,
}: UseTemplateButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [travelers, setTravelers] = useState(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await apiPost<{ tripId: string; generated: boolean }>(
        "/templates/use",
        {
          templateId,
          startDate,
          travelers,
        },
      );
      router.push(
        result.generated
          ? `/dashboard/trips/${result.tripId}/planner`
          : `/dashboard/trips/${result.tripId}`,
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal membuat perjalanan",
      );
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900"
      >
        Pakai template
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={submit}
            className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-neutral-900">{title}</h2>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {days} hari. Rencana disusun otomatis dan bisa kamu ubah
                  setelahnya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="size-5" />
              </button>
            </div>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-neutral-800">
                Tanggal mulai
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-neutral-800">
                Jumlah traveler
              </span>
              <input
                type="number"
                min={1}
                max={100}
                value={travelers}
                onChange={(event) =>
                  setTravelers(Math.max(1, Number(event.target.value) || 1))
                }
                required
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2"
              />
            </label>

            <p className="text-xs text-neutral-500">
              Estimasi budget awal {formatIDR(dailyBudget * days * travelers)}{" "}
              (kasar, di luar tiket transportasi). Bisa diubah di halaman Edit.
            </p>

            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
            >
              {saving ? "Menyusun perjalanan..." : "Buat perjalanan"}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
