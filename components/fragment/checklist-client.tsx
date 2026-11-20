"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { ApiClientError, apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  CHECKLIST_KINDS,
  CHECKLIST_KIND_LABELS,
  type ChecklistKindValue,
} from "@/data/trip-extra";
import type { ChecklistItemDTO } from "@/@type/trip-extra";

type ChecklistClientProps = {
  tripId: string;
  initialItems: ChecklistItemDTO[];
  canEdit: boolean;
};

export function ChecklistClient({
  tripId,
  initialItems,
  canEdit,
}: ChecklistClientProps) {
  const [items, setItems] = useState(initialItems);
  const [kind, setKind] = useState<ChecklistKindValue>("PACKING");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = items.filter((item) => item.kind === kind);
  const doneCount = visible.filter((item) => item.done).length;
  const percent =
    visible.length === 0 ? 0 : Math.round((doneCount / visible.length) * 100);

  function fail(err: unknown, fallback: string) {
    setError(err instanceof ApiClientError ? err.message : fallback);
  }

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = await apiPost<ChecklistItemDTO[]>(
        `/trips/${tripId}/checklist`,
        { kind, text: value },
      );
      setItems(next);
      setText("");
    } catch (err) {
      fail(err, "Gagal menambah item");
    } finally {
      setBusy(false);
    }
  }

  async function addPreset() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      setItems(
        await apiPost<ChecklistItemDTO[]>(`/trips/${tripId}/checklist`, {
          kind,
          preset: true,
        }),
      );
    } catch (err) {
      fail(err, "Gagal menambah daftar contoh");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: ChecklistItemDTO) {
    const done = !item.done;
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, done } : entry,
      ),
    );
    setError(null);
    try {
      await apiPatch(`/trips/${tripId}/checklist/${item.id}`, { done });
    } catch (err) {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, done: item.done } : entry,
        ),
      );
      fail(err, "Gagal menyimpan perubahan");
    }
  }

  async function remove(item: ChecklistItemDTO) {
    const previous = items;
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    setError(null);
    try {
      await apiDelete(`/trips/${tripId}/checklist/${item.id}`);
    } catch (err) {
      setItems(previous);
      fail(err, "Gagal menghapus item");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {CHECKLIST_KINDS.map((value) => {
          const total = items.filter((item) => item.kind === value).length;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                kind === value
                  ? "border-teal-800 bg-teal-800 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
              )}
            >
              {CHECKLIST_KIND_LABELS[value]} ({total})
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-900">
            {doneCount} dari {visible.length} selesai
          </span>
          <span className="text-neutral-500">{percent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-teal-700 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {canEdit ? (
        <form onSubmit={add} className="flex gap-2">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={160}
            placeholder={
              kind === "PACKING" ? "Tambah barang bawaan" : "Tambah persiapan"
            }
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
          <button
            type="submit"
            disabled={busy || text.trim() === ""}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900 disabled:opacity-50"
          >
            <Plus className="size-4" />
            Tambah
          </button>
        </form>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="font-medium text-neutral-900">Belum ada item</p>
          <p className="mt-1 text-sm text-neutral-500">
            {canEdit
              ? "Tambah satu per satu atau mulai dari daftar contoh."
              : "Belum ada yang dicatat."}
          </p>
          {canEdit ? (
            <button
              type="button"
              onClick={addPreset}
              disabled={busy}
              className="mt-4 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Pakai daftar contoh
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {visible.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => toggle(item)}
                aria-label={
                  item.done ? "Tandai belum selesai" : "Tandai selesai"
                }
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded border transition",
                  item.done
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-neutral-300 bg-white",
                  !canEdit && "cursor-default",
                )}
              >
                {item.done ? <Check className="size-3.5" /> : null}
              </button>
              <span
                className={cn(
                  "flex-1 text-sm",
                  item.done
                    ? "text-neutral-400 line-through"
                    : "text-neutral-800",
                )}
              >
                {item.text}
              </span>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label="Hapus"
                  className="text-neutral-400 transition hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit && visible.length > 0 ? (
        <button
          type="button"
          onClick={addPreset}
          disabled={busy}
          className="text-sm font-medium text-teal-800 hover:underline disabled:opacity-50"
        >
          Tambah daftar contoh yang belum ada
        </button>
      ) : null}
    </div>
  );
}
