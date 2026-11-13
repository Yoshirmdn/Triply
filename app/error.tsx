"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Terjadi kesalahan
      </h1>
      <p className="max-w-sm text-sm text-neutral-500">
        Sesuatu tidak berjalan semestinya. Coba muat ulang atau kembali ke
        beranda.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          Beranda
        </Link>
      </div>
    </div>
  );
}
