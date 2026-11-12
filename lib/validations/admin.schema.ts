import { z } from "zod";
import { TRIP_STATUSES } from "@/data/trip";

export const listUsersQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  role: z.enum(["SUPER_ADMIN", "USER"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateUserSchema = z
  .object({
    role: z.enum(["SUPER_ADMIN", "USER"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.isActive !== undefined, {
    message: "Nothing to update",
  });

export const listAdminTripsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(TRIP_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const listActivityQuerySchema = z.object({
  action: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});