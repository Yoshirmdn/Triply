import "server-only";
import { prisma } from "@/lib/prisma";
import { toDateInput } from "@/utils/date";
import type { ExpenseDTO, ExpenseSummaryDTO } from "@/@type/expense";
import type { ExpenseCategoryValue } from "@/data/expense";

export function serializeExpense(expense: {
  id: string;
  tripId: string;
  category: ExpenseCategoryValue;
  description: string;
  amount: { toString(): string };
  expenseDate: Date;
}): ExpenseDTO {
  return {
    id: expense.id,
    tripId: expense.tripId,
    category: expense.category,
    description: expense.description,
    amount: expense.amount.toString(),
    expenseDate: toDateInput(expense.expenseDate),
  };
}

export async function getExpenseSummary(tripId: string, budget: { toString(): string }): Promise<ExpenseSummaryDTO> {
  const [byCategory, byDay] = await Promise.all([
    prisma.expense.groupBy({ by: ["category"], where: { tripId }, _sum: { amount: true } }),
    prisma.expense.groupBy({
      by: ["expenseDate"],
      where: { tripId },
      _sum: { amount: true },
      orderBy: { expenseDate: "asc" },
    }),
  ]);

  const budgetValue = Number(budget.toString());
  const categoryRows = byCategory.map((row) => ({
    category: row.category as ExpenseCategoryValue,
    total: (row._sum.amount ?? 0).toString(),
  }));
  const totalSpent = categoryRows.reduce((sum, row) => sum + Number(row.total), 0);

  return {
    budget: budgetValue.toString(),
    totalSpent: totalSpent.toString(),
    remaining: (budgetValue - totalSpent).toString(),
    percentUsed: budgetValue > 0 ? Math.round((totalSpent / budgetValue) * 100) : totalSpent > 0 ? 100 : 0,
    byCategory: categoryRows,
    byDay: byDay.map((row) => ({ date: toDateInput(row.expenseDate), total: (row._sum.amount ?? 0).toString() })),
  };
}