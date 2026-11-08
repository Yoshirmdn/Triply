import "server-only";
import { notFound } from "next/navigation";
import { ZodError } from "zod";
import { ApiError } from "@/lib/errors";
import { getTrip } from "@/controller/trip.controller";
import type { Actor } from "@/@type/auth";

export async function loadTripOrNotFound(actor: Actor, tripId: string) {
  try {
    return await getTrip(actor, tripId);
  } catch (error) {
    if (error instanceof ZodError) notFound();
    if (error instanceof ApiError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}