import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { assertTripAccess } from "@/lib/permissions";
import { validateTripDates } from "@/lib/validations/trip.schema";
import type { ListTripsQuery, TripInput, TripUpdateInput } from "@/lib/validations/trip.schema";
import type { Actor } from "@/@type/auth";
import type {
  TripDayDTO,
  TripDetailDTO,
  TripDTO,
  TripListResult,
  UserDashboardData,
} from "@/@type/trip";
import type { TripStatusValue } from "@/data/trip";
import { buildDateRange, parseDateInput, toDateInput, todayUTC } from "@/utils/date";

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

function memberSelect(actorId: string) {
  return { where: { userId: actorId }, select: { role: true } } as const;
}

function accessWhere(actor: Actor) {
  return { OR: [{ userId: actor.id }, { members: { some: { userId: actor.id } } }] };
}

function serializeTrip(trip: TripRecord, actor: Actor): TripDTO {
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

function serializeDay(day: DayRecord): TripDayDTO {
  return {
    id: day.id,
    date: toDateInput(day.date),
    dayNumber: day.dayNumber,
    itemCount: day._count.items,
  };
}

async function syncTripDays(tx: Pick<typeof prisma, "tripDay">, tripId: string, start: Date, end: Date) {
  const dates = buildDateRange(start, end);
  const wanted = new Map(dates.map((date, index) => [date.getTime(), index + 1]));

  const existing = await tx.tripDay.findMany({
    where: { tripId },
    include: { _count: { select: { items: true } } },
  });

  const stale = existing.filter((day) => !wanted.has(day.date.getTime()));
  if (stale.some((day) => day._count.items > 0)) {
    throw new ApiError(
      "CONFLICT",
      "Ada itinerary pada hari yang akan dihapus. Pindahkan atau hapus dulu itinerary tersebut.",
    );
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

export async function listTrips(actor: Actor, query: ListTripsQuery): Promise<TripListResult> {
  const where = { ...accessWhere(actor), ...(query.status ? { status: query.status } : {}) };

  const [items, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: { startDate: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { members: memberSelect(actor.id) },
    }),
    prisma.trip.count({ where }),
  ]);

  return {
    items: items.map((trip) => serializeTrip(trip, actor)),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function getTrip(actor: Actor, tripId: string): Promise<TripDetailDTO> {
  await assertTripAccess(tripId, actor, "read");

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      members: memberSelect(actor.id),
      days: { orderBy: { dayNumber: "asc" }, include: { _count: { select: { items: true } } } },
    },
  });
  if (!trip) throw new ApiError("NOT_FOUND", "Perjalanan tidak ditemukan");

  return { ...serializeTrip(trip, actor), days: trip.days.map(serializeDay) };
}

export async function createTrip(actor: Actor, input: TripInput): Promise<TripDTO> {
  const start = parseDateInput(input.startDate);
  const end = parseDateInput(input.endDate);

  const trip = await prisma.$transaction(async (tx) => {
    const created = await tx.trip.create({
      data: {
        userId: actor.id,
        title: input.title,
        destination: input.destination,
        description: input.description || null,
        startDate: start,
        endDate: end,
        travelers: input.travelers,
        budget: input.budget,
        coverImage: input.coverImage || null,
        status: input.status,
      },
      include: { members: memberSelect(actor.id) },
    });

    await syncTripDays(tx, created.id, start, end);
    await tx.activityLog.create({
      data: {
        userId: actor.id,
        action: "TRIP_CREATED",
        description: `Membuat perjalanan "${created.title}"`,
      },
    });

    return created;
  });

  return serializeTrip(trip, actor);
}

export async function updateTrip(actor: Actor, tripId: string, patch: TripUpdateInput): Promise<TripDTO> {
  await assertTripAccess(tripId, actor, "write");

  const existing = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!existing) throw new ApiError("NOT_FOUND", "Perjalanan tidak ditemukan");

  const startValue = patch.startDate ?? toDateInput(existing.startDate);
  const endValue = patch.endDate ?? toDateInput(existing.endDate);
  const dateError = validateTripDates(startValue, endValue);
  if (dateError) throw new ApiError("BAD_REQUEST", dateError);

  const start = parseDateInput(startValue);
  const end = parseDateInput(endValue);
  const datesChanged =
    start.getTime() !== existing.startDate.getTime() || end.getTime() !== existing.endDate.getTime();

  const trip = await prisma.$transaction(async (tx) => {
    const updated = await tx.trip.update({
      where: { id: tripId },
      data: {
        title: patch.title,
        destination: patch.destination,
        description: patch.description === undefined ? undefined : patch.description || null,
        startDate: patch.startDate ? start : undefined,
        endDate: patch.endDate ? end : undefined,
        travelers: patch.travelers,
        budget: patch.budget,
        coverImage: patch.coverImage === undefined ? undefined : patch.coverImage || null,
        status: patch.status,
      },
      include: { members: memberSelect(actor.id) },
    });

    if (datesChanged) await syncTripDays(tx, tripId, start, end);

    await tx.activityLog.create({
      data: {
        userId: actor.id,
        action: "TRIP_UPDATED",
        description: `Memperbarui perjalanan "${updated.title}"`,
      },
    });

    return updated;
  });

  return serializeTrip(trip, actor);
}

export async function deleteTrip(actor: Actor, tripId: string): Promise<void> {
  const { access } = await assertTripAccess(tripId, actor, "write");
  if (access !== "owner") throw new ApiError("FORBIDDEN", "Hanya pemilik yang dapat menghapus perjalanan");

  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { title: true } });
  if (!trip) throw new ApiError("NOT_FOUND", "Perjalanan tidak ditemukan");

  await prisma.$transaction([
    prisma.trip.delete({ where: { id: tripId } }),
    prisma.activityLog.create({
      data: {
        userId: actor.id,
        action: "TRIP_DELETED",
        description: `Menghapus perjalanan "${trip.title}"`,
      },
    }),
  ]);
}

export async function listTripDays(actor: Actor, tripId: string): Promise<TripDayDTO[]> {
  await assertTripAccess(tripId, actor, "read");

  const days = await prisma.tripDay.findMany({
    where: { tripId },
    orderBy: { dayNumber: "asc" },
    include: { _count: { select: { items: true } } },
  });
  return days.map(serializeDay);
}

export async function regenerateTripDays(actor: Actor, tripId: string): Promise<TripDayDTO[]> {
  await assertTripAccess(tripId, actor, "write");

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { startDate: true, endDate: true },
  });
  if (!trip) throw new ApiError("NOT_FOUND", "Perjalanan tidak ditemukan");

  await prisma.$transaction(async (tx) => {
    await syncTripDays(tx, tripId, trip.startDate, trip.endDate);
  });

  return listTripDays(actor, tripId);
}

export async function getUserDashboard(actor: Actor): Promise<UserDashboardData> {
  const base = accessWhere(actor);
  const today = todayUTC();

  const [totalTrips, upcomingTrips, completedTrips, budget, recent] = await Promise.all([
    prisma.trip.count({ where: base }),
    prisma.trip.count({
      where: { ...base, startDate: { gte: today }, status: { in: ["PLANNING", "UPCOMING"] } },
    }),
    prisma.trip.count({ where: { ...base, status: "COMPLETED" } }),
    prisma.trip.aggregate({ where: { ...base, status: { not: "CANCELLED" } }, _sum: { budget: true } }),
    prisma.trip.findMany({
      where: base,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { members: memberSelect(actor.id) },
    }),
  ]);

  return {
    totalTrips,
    upcomingTrips,
    completedTrips,
    totalBudget: budget._sum.budget?.toString() ?? "0",
    recentTrips: recent.map((trip) => serializeTrip(trip, actor)),
  };
}