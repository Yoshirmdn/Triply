import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { uuidSchema } from "@/lib/validations/common.schema";
import { accessWhere, memberSelect, serializeDay, serializeTrip } from "@/lib/trip-helpers";
import type { Actor } from "@/@type/auth";
import type { TripDetailDTO } from "@/@type/trip";

export async function loadTripOrNotFound(actor: Actor, tripId: string): Promise<TripDetailDTO> {
  if (!uuidSchema.safeParse(tripId).success) notFound();

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, ...accessWhere(actor) },
    include: {
      members: memberSelect(actor.id),
      days: { orderBy: { dayNumber: "asc" }, include: { _count: { select: { items: true } } } },
    },
  });
  if (!trip) notFound();

  return { ...serializeTrip(trip, actor), days: trip.days.map(serializeDay) };
}