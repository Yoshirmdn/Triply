"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900"
    >
      <Printer className="size-4" />
      Cetak atau simpan PDF
    </button>
  );
}
