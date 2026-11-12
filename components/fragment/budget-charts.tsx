"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EXPENSE_CATEGORY_COLORS, EXPENSE_CATEGORY_LABELS } from "@/data/expense";
import { formatDateID } from "@/utils/date";
import { formatIDR } from "@/utils/format";
import type { ExpenseSummaryDTO } from "@/@type/expense";

export function BudgetCharts({ summary }: { summary: ExpenseSummaryDTO }) {
  const categoryData = summary.byCategory.map((row) => ({
    name: EXPENSE_CATEGORY_LABELS[row.category],
    value: Number(row.total),
    color: EXPENSE_CATEGORY_COLORS[row.category],
  }));
  const dayData = summary.byDay.map((row) => ({ date: formatDateID(row.date), total: Number(row.total) }));

  if (categoryData.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
        Grafik akan muncul setelah ada pengeluaran.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-neutral-900">Pengeluaran per kategori</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatIDR(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-neutral-900">Pengeluaran per hari</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}rb`} width={48} />
              <Tooltip formatter={(value) => formatIDR(Number(value))} />
              <Bar dataKey="total" name="Total" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}