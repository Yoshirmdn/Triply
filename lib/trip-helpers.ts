import "server-only";
import type { prisma } from "@/lib/prisma";
import type { Actor } from "@/@type/auth";
import type { TripDayDTO, TripDTO } from "@/@type/trip";
import type { TripStatusValue } from "@/data/trip";
import { buildDateRange, toDateInput } from "@/utils/date";

type TripRecord = {
  id: string;
  userId: string;
  title: string;
  destination: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  travelers: number;
  budget: { toString(): string };
  coverImage: string | null;
  status: TripStatusValue;
  isPublic: boolean;
  members: { role: string }[];
};

type DayRecord = {
  id: string;
  date: Date;
  dayNumber: number;
  _count: { items: number };
};
export class TripDayConflictError extends Error {
  constructor() {
    super("Ada itinerary pada hari yang akan dihapus. Pindahkan atau hapus dulu itinerary tersebut.");
    this.name = "TripDayConflictError";
  }
}

export function memberSelect(actorId: string) {
  return { where: { userId: actorId }, select: { role: true } } as const;
}

export function accessWhere(actor: Actor) {
  return { OR: [{ userId: actor.id }, { members: { some: { userId: actor.id } } }] };
}

export function serializeTrip(trip: TripRecord, actor: Actor): TripDTO {
  const isOwner = trip.userId === actor.id;
  const memberRole = trip.members[0]?.role;
  return {
    id: trip.id,
    title: trip.title,
    destination: trip.destination,
    description: trip.description,
    startDate: toDateInput(trip.startDate),
    endDate: toDateInput(trip.endDate),
    travelers: trip.travelers,
    budget: trip.budget.toString(),
    coverImage: trip.coverImage,
    status: trip.status,
    isPublic: trip.isPublic,
    isOwner,
    canEdit: isOwner || (memberRole !== undefined && memberRole !== "VIEWER"),
  };
}

export function serializeDay(day: DayRecord): TripDayDTO {
  return {
    id: day.id,
    date: toDateInput(day.date),
    dayNumber: day.dayNumber,
    itemCount: day._count.items,
  };
}

export async function syncTripDays(tx: Pick<typeof prisma, "tripDay">, tripId: string, start: Date, end: Date) {
  const dates = buildDateRange(start, end);
  const wanted = new Map(dates.map((date, index) => [date.getTime(), index + 1]));

  const existing = await tx.tripDay.findMany({
    where: { tripId },
    include: { _count: { select: { items: true } } },
  });

  const stale = existing.filter((day) => !wanted.has(day.date.getTime()));
  if (stale.some((day) => day._count.items > 0)) {
    throw new TripDayConflictError();
  }
  if (stale.length > 0) {
    await tx.tripDay.deleteMany({ where: { id: { in: stale.map((day) => day.id) } } });
  }

  const kept = existing.filter((day) => wanted.has(day.date.getTime()));
  const moves = kept.filter((day) => day.dayNumber !== wanted.get(day.date.getTime()));

  for (const day of moves) {
    const target = wanted.get(day.date.getTime()) as number;
    await tx.tripDay.update({ where: { id: day.id }, data: { dayNumber: -target } });
  }
  for (const day of moves) {
    const target = wanted.get(day.date.getTime()) as number;
    await tx.tripDay.update({ where: { id: day.id }, data: { dayNumber: target } });
  }

  const keptTimes = new Set(kept.map((day) => day.date.getTime()));
  const missing = dates.filter((date) => !keptTimes.has(date.getTime()));
  if (missing.length > 0) {
    await tx.tripDay.createMany({
      data: missing.map((date) => ({
        tripId,
        date,
        dayNumber: wanted.get(date.getTime()) as number,
      })),
    });
  }
}