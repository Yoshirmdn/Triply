"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { ApiClientError, apiDelete } from "@/lib/api-client";
import { BudgetCharts } from "@/components/fragment/budget-charts";
import { ExpenseForm } from "@/components/fragment/expense-form";
import { EXPENSE_CATEGORY_COLORS, EXPENSE_CATEGORY_LABELS } from "@/data/expense";
import { cn } from "@/lib/utils";
import { formatDateID } from "@/utils/date";
import { formatIDR } from "@/utils/format";
import type { ExpenseDTO, ExpenseSummaryDTO } from "@/@type/expense";

type BudgetClientProps = {
  tripId: string;
  canEdit: boolean;
  defaultDate: string;
  expenses: ExpenseDTO[];
  summary: ExpenseSummaryDTO;
};

export function BudgetClient({ tripId, canEdit, defaultDate, expenses, summary }: BudgetClientProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const remaining = Number(summary.remaining);
  const over = remaining < 0;
  const barWidth = Math.min(summary.percentUsed, 100);

  async function remove(expense: ExpenseDTO) {
    if (!window.confirm(`Hapus pengeluaran "${expense.description}"?`)) return;
    setBusyId(expense.id);
    setError(null);
    try {
      await apiDelete(`/trips/${tripId}/expenses/${expense.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Gagal menghapus pengeluaran");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Budget</p>
          <p className="mt-2 text-xl font-semibold text-neutral-900">{formatIDR(summary.budget)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Terpakai</p>
          <p className="mt-2 text-xl font-semibold text-neutral-900">{formatIDR(summary.totalSpent)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">{over ? "Melebihi budget" : "Sisa"}</p>
          <p className={cn("mt-2 text-xl font-semibold", over ? "text-red-600" : "text-teal-800")}>
            {formatIDR(Math.abs(remaining))}
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-700">Penggunaan budget</span>
          <span className={cn("font-medium", over ? "text-red-600" : "text-neutral-700")}>{summary.percentUsed}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
          <div
            className={cn("h-full rounded-full transition-all", over ? "bg-red-500" : "bg-teal-700")}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      <BudgetCharts summary={summary} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          <h2 className="text-lg font-semibold text-neutral-900">Daftar pengeluaran</h2>
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          {expenses.length === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
              Belum ada pengeluaran tercatat.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
              {expenses.map((expense) => (
                <li key={expense.id} className="px-4 py-3">
                  {editingId === expense.id ? (
                    <ExpenseForm
                      tripId={tripId}
                      defaultDate={defaultDate}
                      expense={expense}
                      onDone={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: EXPENSE_CATEGORY_COLORS[expense.category] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900">{expense.description}</p>
                        <p className="text-xs text-neutral-500">
                          {EXPENSE_CATEGORY_LABELS[expense.category]} · {formatDateID(expense.expenseDate)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-neutral-900">{formatIDR(expense.amount)}</p>
                      {canEdit ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(expense.id)}
                            aria-label="Edit"
                            className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(expense)}
                            disabled={busyId === expense.id}
                            aria-label="Hapus"
                            className="rounded p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {canEdit ? (
          <div className="lg:col-span-2">
            <ExpenseForm tripId={tripId} defaultDate={defaultDate} />
          </div>
        ) : null}
      </div>
    </div>
  );
}