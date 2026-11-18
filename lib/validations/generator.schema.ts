import { z } from "zod";
import { MAX_GENERATE_DAYS, TRIP_PACES, TRIP_STYLES } from "@/data/generator";
import { DEFAULT_SEARCH_RADIUS } from "@/data/places";
import { placeInputSchema } from "@/lib/validations/place.schema";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const generateRequestSchema = z.object({
  style: z.enum(TRIP_STYLES).default("BALANCED"),
  pace: z.enum(TRIP_PACES).default("NORMAL"),
  radius: z.number().int().min(1000).max(50000).default(DEFAULT_SEARCH_RADIUS),
});

export const applyPlanSchema = z.object({
  replace: z.boolean().default(false),
  days: z
    .array(
      z.object({
        dayNumber: z.number().int().min(1).max(60),
        items: z
          .array(
            z
              .object({
                place: placeInputSchema,
                startTime: timeSchema,
                endTime: timeSchema,
                notes: z.string().trim().max(2000).nullable().optional(),
              })
              .refine((item) => item.endTime >= item.startTime, {
                path: ["endTime"],
                message: "End time must be after start time",
              }),
          )
          .max(15),
      }),
    )
    .min(1)
    .max(MAX_GENERATE_DAYS),
});

export const useTemplateSchema = z.object({
  templateId: z.string().trim().min(1).max(60),
  startDate: z.iso.date("Tanggal mulai tidak valid"),
  travelers: z.number().int().min(1).max(100).default(1),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type ApplyPlanInput = z.infer<typeof applyPlanSchema>;
