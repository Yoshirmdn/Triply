import type { ExpenseCategoryValue } from "@/data/expense";

export type ExpenseDTO = {
  id: string;
  tripId: string;
  category: ExpenseCategoryValue;
  description: string;
  amount: string;
  expenseDate: string;
};

export type ExpenseSummaryDTO = {
  budget: string;
  totalSpent: string;
  remaining: string;
  percentUsed: number;
  byCategory: { category: ExpenseCategoryValue; total: string }[];
  byDay: { date: string; total: string }[];
};