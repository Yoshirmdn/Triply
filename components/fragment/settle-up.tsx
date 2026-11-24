"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Undo2 } from "lucide-react";
import { ApiClientError, apiDelete, apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatDateID } from "@/utils/date";
import { formatIDR } from "@/utils/format";
import type { SettlementSummaryDTO, TransferDTO } from "@/@type/settlement";

type SettleUpProps = {
  tripId: string;
  canEdit: boolean;
  currentUserId: string;
  summary: SettlementSummaryDTO;
};

export function SettleUp({ tripId, canEdit, currentUserId, summary }: SettleUpProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nameById = new Map(summary.participants.map((person) => [person.id, person.name]));
  const label = (userId: string) => `${nameById.get(userId) ?? "Anggota"}${userId === currentUserId ? " (kamu)" : ""}`;

  if (summary.participants.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-5">
        <h2 className="font-semibold text-neutral-900">Patungan</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Undang teman ke perjalanan ini untuk membagi pengeluaran dan melihat siapa berutang ke siapa.
        </p>
      </div>
    );
  }

  const settled = summary.transfers.length === 0;

  async function markPaid(transfer: TransferDTO) {
    const key = `${transfer.fromUserId}:${transfer.toUserId}`;
    setBusy(key);
    setError(null);
    try {
      await apiPost(`/trips/${tripId}/settlements`, transfer);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Gagal mencatat pelunasan");
    } finally {
      setBusy(null);
    }
  }

  async function undo(paymentId: string) {
    setBusy(paymentId);
    setError(null);
    try {
      await apiDelete(`/trips/${tripId}/settlements/${paymentId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Gagal membatalkan pelunasan");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-neutral-900">Patungan</h2>
        <p className="text-sm text-neutral-500">Total yang dibagi: {formatIDR(summary.sharedTotal)}</p>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <ul className="divide-y divide-neutral-100">
        {summary.balances.map((entry) => (
          <li key={entry.userId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="font-medium text-neutral-900">{label(entry.userId)}</span>
            <span
              className={cn(
                "font-medium",
                entry.balance > 0 ? "text-teal-800" : entry.balance < 0 ? "text-red-600" : "text-neutral-400",
              )}
            >
              {entry.balance > 0
                ? `Menerima ${formatIDR(entry.balance)}`
                : entry.balance < 0
                  ? `Membayar ${formatIDR(-entry.balance)}`
                  : "Lunas"}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-neutral-700">Cara melunasi</h3>
        {settled ? (
          <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
            {summary.sharedTotal > 0 ? "Semua pengeluaran bersama sudah lunas." : "Belum ada pengeluaran yang dibagi."}
          </p>
        ) : (
          <ul className="space-y-2">
            {summary.transfers.map((transfer) => {
              const key = `${transfer.fromUserId}:${transfer.toUserId}`;
              return (
                <li
                  key={key}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm"
                >
                  <span className="font-medium text-neutral-900">{label(transfer.fromUserId)}</span>
                  <ArrowRight className="size-4 text-neutral-400" />
                  <span className="font-medium text-neutral-900">{label(transfer.toUserId)}</span>
                  <span className="ml-auto font-semibold text-neutral-900">{formatIDR(transfer.amount)}</span>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => markPaid(transfer)}
                      disabled={busy === key}
                      className="rounded-lg border border-teal-800 px-3 py-1 text-xs font-medium text-teal-800 transition hover:bg-teal-50 disabled:opacity-60"
                    >
                      {busy === key ? "Menyimpan..." : "Tandai lunas"}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {summary.payments.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-neutral-700">Riwayat pelunasan</h3>
          <ul className="divide-y divide-neutral-100 text-sm">
            {summary.payments.map((payment) => (
              <li key={payment.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1 text-neutral-600">
                  {label(payment.fromUserId)} membayar {label(payment.toUserId)}{" "}
                  <strong className="text-neutral-900">{formatIDR(payment.amount)}</strong>
                  <span className="text-neutral-400"> · {formatDateID(payment.createdAt.slice(0, 10))}</span>
                </span>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => undo(payment.id)}
                    disabled={busy === payment.id}
                    aria-label="Batalkan pelunasan"
                    className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-60"
                  >
                    <Undo2 className="size-4" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.unassignedCount > 0 ? (
        <p className="text-xs text-neutral-400">
          {summary.unassignedCount} pengeluaran tanpa pembayar tidak ikut dihitung. Edit pengeluaran dan pilih pembayarnya untuk membaginya.
        </p>
      ) : null}
    </section>
  );
}