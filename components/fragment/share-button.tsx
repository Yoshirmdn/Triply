"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Link2, Share2, X } from "lucide-react";
import { ApiClientError, apiDelete, apiGet, apiPost } from "@/lib/api-client";
import type { ShareStateDTO } from "@/@type/share";

export function ShareButton({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ShareStateDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => request.current?.abort();
  }, []);

  async function openDialog() {
    setOpen(true);
    setError(null);
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const data = await apiGet<ShareStateDTO>(`/trips/${tripId}/share`, {
        signal: controller.signal,
      });
      setState(data);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal memuat status berbagi",
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setCopied(false);
    request.current?.abort();
  }

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      setState(await apiPost<ShareStateDTO>(`/trips/${tripId}/share`));
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal mengaktifkan tautan",
      );
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (
      !window.confirm(
        "Matikan tautan publik? Tautan lama tidak akan bisa dibuka lagi.",
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      setState(await apiDelete<ShareStateDTO>(`/trips/${tripId}/share`));
      setCopied(false);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Gagal menonaktifkan tautan",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!state?.path) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${state.path}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Gagal menyalin. Salin tautan secara manual.");
    }
  }

  const fullUrl =
    state?.path && typeof window !== "undefined"
      ? `${window.location.origin}${state.path}`
      : (state?.path ?? "");

  return (
    <>
      <button
        type="button"
        onClick={() => void openDialog()}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        <Share2 className="size-4" />
        Bagikan
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-neutral-900">
                  Bagikan perjalanan
                </h2>
                <p className="mt-0.5 text-sm text-neutral-500">
                  Siapa pun dengan tautan bisa melihat itinerary. Budget dan
                  pengeluaran tidak ikut dibagikan.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Tutup"
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="size-5" />
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-neutral-500">Memuat...</p>
            ) : null}

            {!loading && state?.isPublic && state.path ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2">
                  <Link2 className="size-4 shrink-0 text-neutral-400" />
                  <input
                    readOnly
                    value={fullUrl}
                    onFocus={(event) => event.currentTarget.select()}
                    className="min-w-0 flex-1 bg-transparent text-sm text-neutral-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void copy()}
                    className="inline-flex items-center gap-1 text-sm font-medium text-teal-800 hover:underline"
                  >
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    {copied ? "Tersalin" : "Salin"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void disable()}
                  disabled={busy}
                  className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  {busy ? "Memproses..." : "Matikan tautan publik"}
                </button>
              </div>
            ) : null}

            {!loading && state && !state.isPublic ? (
              <button
                type="button"
                onClick={() => void enable()}
                disabled={busy}
                className="w-full rounded-lg bg-teal-800 px-3 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
              >
                {busy ? "Memproses..." : "Buat tautan publik"}
              </button>
            ) : null}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
