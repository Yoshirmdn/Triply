import { z } from "zod";
import { CHECKLIST_KINDS, NOTE_KINDS } from "@/data/trip-extra";

export const createChecklistSchema = z
  .object({
    kind: z.enum(CHECKLIST_KINDS).default("PACKING"),
    text: z.string().trim().min(1).max(160).optional(),
    preset: z.boolean().optional(),
  })
  .refine((value) => value.preset === true || value.text !== undefined, {
    message: "Provide text or preset",
    path: ["text"],
  });

export const updateChecklistSchema = z
  .object({
    done: z.boolean().optional(),
    text: z.string().trim().min(1).max(160).optional(),
  })
  .refine((value) => value.done !== undefined || value.text !== undefined, {
    message: "Nothing to update",
  });

const httpUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Invalid url");

const noteFields = {
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().max(5000).nullable().optional(),
  reference: z.string().trim().max(80).nullable().optional(),
  url: httpUrlSchema.nullable().optional(),
  dayNumber: z.number().int().min(1).max(60).nullable().optional(),
};

export const createNoteSchema = z.object({
  kind: z.enum(NOTE_KINDS).default("NOTE"),
  ...noteFields,
});

export const updateNoteSchema = z
  .object({
    kind: z.enum(NOTE_KINDS).optional(),
    title: noteFields.title.optional(),
    content: noteFields.content,
    reference: noteFields.reference,
    url: noteFields.url,
    dayNumber: noteFields.dayNumber,
  })
  .refine(
    (value) => Object.values(value).some((entry) => entry !== undefined),
    {
      message: "Nothing to update",
    },
  );

export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
