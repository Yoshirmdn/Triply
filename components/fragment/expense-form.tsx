"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiClientError, apiPatch, apiPost } from "@/lib/api-client";
import { expenseInputSchema, type ExpenseInput } from "@/lib/validations/expense.schema";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "@/data/expense";
import type { ExpenseDTO } from "@/@type/expense";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20";

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      {children}
      {error ? <span className="block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

type ExpenseFormProps = {
  tripId: string;
  defaultDate: string;
  expense?: ExpenseDTO;
  onDone?: () => void;
};

export function ExpenseForm({ tripId, defaultDate, expense, onDone }: ExpenseFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseInputSchema),
    defaultValues: expense
      ? {
          category: expense.category,
          description: expense.description,
          amount: Number(expense.amount),
          expenseDate: expense.expenseDate,
        }
      : { category: "FOOD_DRINKS", description: "", expenseDate: defaultDate },
  });

  async function onSubmit(values: ExpenseInput) {
    setServerError(null);
    try {
      if (expense) {
        await apiPatch(`/trips/${tripId}/expenses/${expense.id}`, values);
      } else {
        await apiPost(`/trips/${tripId}/expenses`, values);
        reset({ category: values.category, description: "", expenseDate: values.expenseDate });
      }
      router.refresh();
      onDone?.();
    } catch (error) {
      setServerError(error instanceof ApiClientError ? error.message : "Gagal menyimpan pengeluaran");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <h3 className="font-semibold text-neutral-900">{expense ? "Edit pengeluaran" : "Tambah pengeluaran"}</h3>
      {serverError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p> : null}

      <Field label="Deskripsi" error={errors.description?.message}>
        <input className={inputClass} placeholder="Makan malam di Malioboro" {...register("description")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategori" error={errors.category?.message}>
          <select className={inputClass} {...register("category")}>
            {EXPENSE_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {EXPENSE_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tanggal" error={errors.expenseDate?.message}>
          <input type="date" className={inputClass} {...register("expenseDate")} />
        </Field>
      </div>

      <Field label="Nominal (IDR)" error={errors.amount?.message}>
        <input
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          className={inputClass}
          placeholder="150000"
          {...register("amount", { valueAsNumber: true })}
        />
      </Field>

      <div className="flex justify-end gap-2">
        {expense ? (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Batal
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900 disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan..." : expense ? "Simpan perubahan" : "Tambahkan"}
        </button>
      </div>
    </form>
  );
}