import { z } from "zod";
import { PLACE_CATEGORIES } from "@/data/places";

export const placeIdSchema = z
  .string()
  .min(5)
  .max(300)
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid place id");

export const placeInputSchema = z.object({
  placeId: placeIdSchema,
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().max(500).nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  category: z.enum(PLACE_CATEGORIES),
});

export const searchPlacesQuerySchema = z
  .object({
    q: z.string().trim().min(2).max(120).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    category: z.enum(PLACE_CATEGORIES).optional(),
    name: z.string().trim().min(2).max(80).optional(),
    radius: z.coerce.number().int().min(100).max(50000).default(5000),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .refine((value) => (value.lat !== undefined && value.lng !== undefined) || value.q !== undefined, {
    message: "Provide lat and lng, or q",
    path: ["q"],
  });

export const autocompleteQuerySchema = z.object({
  input: z.string().trim().min(2).max(120),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export const favoriteInputSchema = z.object({
  place: placeInputSchema,
});

export const addItineraryItemSchema = z.object({
  tripDayId: z.uuid(),
  place: placeInputSchema,
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type PlaceInput = z.infer<typeof placeInputSchema>;

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const updateItineraryItemSchema = z
  .object({
    startTime: timeSchema.nullable().optional(),
    endTime: timeSchema.nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    title: z.string().trim().max(160).nullable().optional(),
  })
  .refine((value) => !(value.startTime && value.endTime) || value.endTime >= value.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const reorderItinerarySchema = z.object({
  days: z
    .array(
      z.object({
        tripDayId: z.uuid(),
        itemIds: z.array(z.uuid()).max(200),
      }),
    )
    .min(1)
    .max(60),
});

export const routeQuerySchema = z.object({
  dayId: z.uuid(),
  mode: z.enum(["drive", "motorcycle", "bicycle", "walk"]).default("drive"),
});