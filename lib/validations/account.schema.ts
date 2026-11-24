import { z } from "zod";
import { TRIP_PACES, TRIP_STYLES } from "@/data/generator";

export const DELETE_ACCOUNT_CONFIRMATION = "HAPUS";

export const accountFieldsSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(80, "Maksimal 80 karakter"),
  defaultTravelers: z.number("Jumlah traveler wajib diisi").int("Harus bilangan bulat").min(1, "Minimal 1").max(100, "Maksimal 100"),
  defaultStyle: z.enum(TRIP_STYLES),
  defaultPace: z.enum(TRIP_PACES),
});

export const updateAccountSchema = accountFieldsSchema
  .partial()
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), { message: "Nothing to update" });

export const deleteAccountSchema = z.object({
  confirm: z.literal(DELETE_ACCOUNT_CONFIRMATION, { error: `Ketik ${DELETE_ACCOUNT_CONFIRMATION} untuk konfirmasi` }),
});

export type AccountFieldsInput = z.infer<typeof accountFieldsSchema>;