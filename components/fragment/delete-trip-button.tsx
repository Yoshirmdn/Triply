"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError, apiDelete } from "@/lib/api-client";

export function DeleteTripButton({ tripId, title }: { tripId: string; title: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(`Hapus perjalanan "${title}"? Semua hari, itinerary, dan pengeluaran ikut terhapus.`)) return;
    setLoading(true);
    setError(null);
    try {
      await apiDelete(`/trips/${tripId}`);
      router.push("/dashboard/trips");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Gagal menghapus perjalanan");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
      >
        {loading ? "Menghapus..." : "Hapus"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}