import { z } from "zod";
import { MAX_EXPENSE_AMOUNT } from "@/data/expense";

export const createSettlementSchema = z
  .object({
    fromUserId: z.uuid(),
    toUserId: z.uuid(),
    amount: z.number().int("Nominal harus bilangan bulat").positive("Nominal harus lebih dari 0").max(MAX_EXPENSE_AMOUNT),
  })
  .refine((value) => value.fromUserId !== value.toUserId, {
    message: "Pembayar dan penerima harus berbeda",
    path: ["toUserId"],
  });

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;