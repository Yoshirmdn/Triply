import "server-only";
import { prisma } from "@/lib/prisma";
import { geocodeFirst } from "@/lib/catalog";
import { fetchWeather } from "@/lib/weather";
import { estimateDayCost } from "@/lib/price";
import { PLACE_PROVIDER } from "@/data/places";
import type { TripDetailDTO } from "@/@type/trip";
import type { DayInsightDTO } from "@/@type/trip-extra";

export async function getTripInsights(
  trip: TripDetailDTO,
): Promise<DayInsightDTO[]> {
  const items = await prisma.itineraryItem.findMany({
    where: { tripDay: { tripId: trip.id }, placeId: { not: null } },
    select: {
      tripDayId: true,
      place: {
        select: {
          provider: true,
          providerPlaceId: true,
          category: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  const ids = items.flatMap((item) =>
    item.place && item.place.provider === PLACE_PROVIDER
      ? [item.place.providerPlaceId]
      : [],
  );
  const catalog = ids.length
    ? await prisma.catalogPlace.findMany({
        where: { externalId: { in: ids } },
        select: { externalId: true, priceRange: true },
      })
    : [];
  const priceById = new Map(
    catalog.map((row) => [row.externalId, row.priceRange]),
  );

  let center: { latitude: number; longitude: number } | null = null;
  try {
    center = await geocodeFirst(trip.destination);
  } catch (error) {
    console.error(error);
  }
  if (!center) {
    const first = items.find((item) => item.place)?.place;
    if (first)
      center = { latitude: first.latitude, longitude: first.longitude };
  }

  const weather = center
    ? await fetchWeather(
        center.latitude,
        center.longitude,
        trip.startDate,
        trip.endDate,
      )
    : new Map();

  return trip.days.map((day) => {
    const dayItems = items.flatMap((item) =>
      item.tripDayId === day.id && item.place
        ? [
            {
              priceRange: priceById.get(item.place.providerPlaceId) ?? null,
              category: item.place.category,
            },
          ]
        : [],
    );
    const estimate = estimateDayCost(dayItems, trip.travelers);
    return {
      dayId: day.id,
      dayNumber: day.dayNumber,
      date: day.date,
      weather: weather.get(day.date) ?? null,
      cost: estimate.total,
      pricedCount: estimate.priced,
      unpricedCount: estimate.unpriced,
    };
  });
}
