import { z } from "zod";
import { EXPENSE_CATEGORIES, MAX_EXPENSE_AMOUNT } from "@/data/expense";

export const expenseInputSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().trim().min(1, "Deskripsi wajib diisi").max(200),
  amount: z
    .number({ error: "Nominal wajib diisi" })
    .positive("Nominal harus lebih dari 0")
    .max(MAX_EXPENSE_AMOUNT, "Nominal terlalu besar"),
  expenseDate: z.iso.date("Tanggal tidak valid"),
});

export const expenseUpdateSchema = expenseInputSchema.partial();

export const listExpensesQuerySchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;