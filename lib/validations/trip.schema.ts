import { z } from "zod";
import { MAX_TRIP_DAYS, TRIP_STATUSES } from "@/data/trip";
import { countDays, parseDateInput } from "@/utils/date";

export const tripBaseSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(120, "Maksimal 120 karakter"),
  destination: z.string().trim().min(1, "Destinasi wajib diisi").max(160, "Maksimal 160 karakter"),
  description: z.string().trim().max(2000, "Maksimal 2000 karakter").optional(),
  startDate: z.iso.date("Tanggal mulai tidak valid"),
  endDate: z.iso.date("Tanggal selesai tidak valid"),
  travelers: z.number("Jumlah traveler wajib diisi").int("Harus bilangan bulat").min(1, "Minimal 1").max(100, "Maksimal 100"),
  budget: z.number("Budget wajib diisi").min(0, "Tidak boleh negatif").max(99_999_999_999, "Terlalu besar"),
  coverImage: z.union([z.url("URL tidak valid"), z.literal("")]).optional(),
  status: z.enum(TRIP_STATUSES),
});

export function validateTripDates(startDate: string, endDate: string): string | null {
  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);
  if (end.getTime() < start.getTime()) return "Tanggal selesai tidak boleh sebelum tanggal mulai";
  if (countDays(start, end) > MAX_TRIP_DAYS) return `Durasi maksimal ${MAX_TRIP_DAYS} hari`;
  return null;
}

export const tripInputSchema = tripBaseSchema.superRefine((value, ctx) => {
  const message = validateTripDates(value.startDate, value.endDate);
  if (message) ctx.addIssue({ code: "custom", path: ["endDate"], message });
});

export const tripUpdateSchema = tripBaseSchema.partial();

export const listTripsQuerySchema = z.object({
  status: z.enum(TRIP_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});

export type TripInput = z.infer<typeof tripInputSchema>;
export type TripUpdateInput = z.infer<typeof tripUpdateSchema>;
export type ListTripsQuery = z.infer<typeof listTripsQuerySchema>;