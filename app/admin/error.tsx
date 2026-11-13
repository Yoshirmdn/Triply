"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="font-semibold text-red-900">Gagal memuat halaman</h2>
      <p className="mt-1 text-sm text-red-700">Terjadi kesalahan saat mengambil data. Silakan coba lagi.</p>
      <button type="button" onClick={reset} className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800">
        Coba lagi
      </button>
    </div>
  );
}