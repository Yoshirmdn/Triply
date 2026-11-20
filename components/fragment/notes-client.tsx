"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { ApiClientError, apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  NOTE_KINDS,
  NOTE_KIND_LABELS,
  type NoteKindValue,
} from "@/data/trip-extra";
import type { TripNoteDTO } from "@/@type/trip-extra";

type NotesClientProps = {
  tripId: string;
  dayCount: number;
  initialNotes: TripNoteDTO[];
  canEdit: boolean;
};

type FormState = {
  kind: NoteKindValue;
  title: string;
  content: string;
  reference: string;
  url: string;
  dayNumber: string;
};

const EMPTY_FORM: FormState = {
  kind: "NOTE",
  title: "",
  content: "",
  reference: "",
  url: "",
  dayNumber: "",
};

function safeHref(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function NotesClient({
  tripId,
  dayCount,
  initialNotes,
  canEdit,
}: NotesClientProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [filter, setFilter] = useState<NoteKindValue | "ALL">("ALL");
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = notes.filter(
    (note) => filter === "ALL" || note.kind === filter,
  );

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function openEdit(note: TripNoteDTO) {
    setEditingId(note.id);
    setForm({
      kind: note.kind,
      title: note.title,
      content: note.content ?? "",
      reference: note.reference ?? "",
      url: note.url ?? "",
      dayNumber: note.dayNumber ? String(note.dayNumber) : "",
    });
    setError(null);
  }

  function close() {
    setForm(null);
    setEditingId(null);
    setError(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || saving) return;
    setSaving(true);
    setError(null);

    const body = {
      kind: form.kind,
      title: form.title.trim(),
      content: form.content.trim() || null,
      reference: form.reference.trim() || null,
      url: form.url.trim() || null,
      dayNumber: form.dayNumber ? Number(form.dayNumber) : null,
    };

    try {
      if (editingId) {
        const updated = await apiPatch<TripNoteDTO>(
          `/trips/${tripId}/notes/${editingId}`,
          body,
        );
        setNotes((current) =>
          current.map((note) => (note.id === updated.id ? updated : note)),
        );
      } else {
        const created = await apiPost<TripNoteDTO>(
          `/trips/${tripId}/notes`,
          body,
        );
        setNotes((current) => [created, ...current]);
      }
      close();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Gagal menyimpan catatan",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(note: TripNoteDTO) {
    if (!window.confirm(`Hapus "${note.title}"?`)) return;
    const previous = notes;
    setNotes((current) => current.filter((entry) => entry.id !== note.id));
    try {
      await apiDelete(`/trips/${tripId}/notes/${note.id}`);
    } catch (err) {
      setNotes(previous);
      setError(
        err instanceof ApiClientError ? err.message : "Gagal menghapus catatan",
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["ALL", ...NOTE_KINDS] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition",
                filter === value
                  ? "border-teal-800 bg-teal-800 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
              )}
            >
              {value === "ALL" ? "Semua" : NOTE_KIND_LABELS[value]}
            </button>
          ))}
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900"
          >
            <Plus className="size-4" />
            Tambah
          </button>
        ) : null}
      </div>

      {error && !form ? <p className="text-sm text-red-600">{error}</p> : null}

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="font-medium text-neutral-900">Belum ada catatan</p>
          <p className="mt-1 text-sm text-neutral-500">
            Simpan kode booking hotel, tiket kereta, atau catatan lain.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((note) => {
            const href = safeHref(note.url);
            return (
              <article
                key={note.id}
                className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          note.kind === "BOOKING"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-teal-50 text-teal-800",
                        )}
                      >
                        {NOTE_KIND_LABELS[note.kind]}
                      </span>
                      {note.dayNumber ? (
                        <span className="text-xs text-neutral-500">
                          Hari {note.dayNumber}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="font-semibold text-neutral-900">
                      {note.title}
                    </h2>
                  </div>
                  {canEdit ? (
                    <div className="flex gap-2 text-neutral-400">
                      <button
                        type="button"
                        onClick={() => openEdit(note)}
                        aria-label="Edit"
                        className="transition hover:text-neutral-900"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(note)}
                        aria-label="Hapus"
                        className="transition hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ) : null}
                </div>

                {note.reference ? (
                  <p className="rounded-lg bg-neutral-50 px-3 py-2 font-mono text-sm tracking-wide text-neutral-900">
                    {note.reference}
                  </p>
                ) : null}
                {note.content ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                    {note.content}
                  </p>
                ) : null}
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-800 hover:underline"
                  >
                    Buka tautan
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {form ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={submit}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-neutral-900">
                {editingId ? "Edit catatan" : "Catatan baru"}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Tutup"
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex gap-2">
              {NOTE_KINDS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, kind: value })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition",
                    form.kind === value
                      ? "border-teal-800 bg-teal-800 text-white"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300",
                  )}
                >
                  {NOTE_KIND_LABELS[value]}
                </button>
              ))}
            </div>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-neutral-700">Judul</span>
              <input
                required
                maxLength={160}
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder={
                  form.kind === "BOOKING"
                    ? "Contoh: Hotel di Bandung"
                    : "Judul catatan"
                }
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            {form.kind === "BOOKING" ? (
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-neutral-700">
                  Kode booking
                </span>
                <input
                  maxLength={80}
                  value={form.reference}
                  onChange={(event) =>
                    setForm({ ...form, reference: event.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                />
              </label>
            ) : null}

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-neutral-700">Isi catatan</span>
              <textarea
                rows={4}
                maxLength={5000}
                value={form.content}
                onChange={(event) =>
                  setForm({ ...form, content: event.target.value })
                }
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-neutral-700">
                  Tautan (opsional)
                </span>
                <input
                  type="url"
                  maxLength={500}
                  value={form.url}
                  onChange={(event) =>
                    setForm({ ...form, url: event.target.value })
                  }
                  placeholder="https://"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-neutral-700">
                  Hari (opsional)
                </span>
                <select
                  value={form.dayNumber}
                  onChange={(event) =>
                    setForm({ ...form, dayNumber: event.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">Semua hari</option>
                  {Array.from({ length: dayCount }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      Hari {index + 1}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving || form.title.trim() === ""}
                className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
