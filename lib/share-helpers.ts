import "server-only";
import { prisma } from "@/lib/prisma";
import { isValidShareToken } from "@/lib/share-token";
import type { PublicTripDTO } from "@/@type/share";
import { toDateInput } from "@/utils/date";

export async function getPublicTrip(
  token: string,
): Promise<PublicTripDTO | null> {
  if (!isValidShareToken(token)) return null;

  const trip = await prisma.trip.findFirst({
    where: { shareToken: token, isPublic: true },
    include: {
      user: { select: { name: true } },
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          items: { orderBy: { sortOrder: "asc" }, include: { place: true } },
        },
      },
    },
  });
  if (!trip) return null;

  return {
    title: trip.title,
    destination: trip.destination,
    description: trip.description,
    startDate: toDateInput(trip.startDate),
    endDate: toDateInput(trip.endDate),
    travelers: trip.travelers,
    status: trip.status,
    ownerName: trip.user.name?.split(" ")[0] ?? "Traveler",
    days: trip.days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      date: toDateInput(day.date),
      items: day.items.map((item) => ({
        id: item.id,
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
        notes: item.notes,
        place: item.place
          ? {
              name: item.place.name,
              address: item.place.address,
              latitude: item.place.latitude,
              longitude: item.place.longitude,
              category: item.place.category,
            }
          : null,
      })),
    })),
  };
}
