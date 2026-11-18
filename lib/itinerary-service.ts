import "server-only";
import { prisma } from "@/lib/prisma";
import { searchCatalog } from "@/lib/catalog";
import { generateItinerary } from "@/lib/itinerary-generator";
import { upsertPlace } from "@/lib/place-helpers";
import { PACE_ACTIVITIES, type TripPaceValue, type TripStyleValue } from "@/data/generator";
import type { PlaceCategoryValue } from "@/data/places";
import type { PlaceDTO } from "@/@type/place";
import type { GeneratedPlanDTO } from "@/@type/generator";
import type { ApplyPlanInput } from "@/lib/validations/generator.schema";

const MIN_RATING = 3.5;

type BuildPlanInput = {
  latitude: number;
  longitude: number;
  radius: number;
  days: number;
  style: TripStyleValue;
  pace: TripPaceValue;
};

export async function buildPlan(input: BuildPlanInput): Promise<GeneratedPlanDTO> {
  const wanted = input.days * PACE_ACTIVITIES[input.pace];
  const main = Math.min(80, Math.max(20, wanted * 2));
  const minor = Math.max(10, Math.round(main / 2));
  const food = Math.min(60, Math.max(15, input.days * 3 + 6));

  const requests: { category: PlaceCategoryValue; limit: number }[] = [
    { category: "ATTRACTION", limit: main },
    { category: "NATURE", limit: main },
    { category: "MUSEUM", limit: minor },
    { category: "ENTERTAINMENT", limit: minor },
    { category: "SHOPPING", limit: minor },
    { category: "RESTAURANT", limit: food },
    { category: "CAFE", limit: food },
  ];

  const results = await Promise.all(
    requests.map((request) =>
      searchCatalog({
        lat: input.latitude,
        lng: input.longitude,
        radius: input.radius,
        limit: request.limit,
        page: 1,
        category: request.category,
        minRating: MIN_RATING,
      }),
    ),
  );

  const places: PlaceDTO[] = results.flatMap((result) => result.places);

  return generateItinerary({ places, days: input.days, style: input.style, pace: input.pace });
}

export async function applyPlan(
  tripId: string,
  plan: ApplyPlanInput,
): Promise<number> {
  const tripDays = await prisma.tripDay.findMany({
    where: { tripId },
    select: { id: true, dayNumber: true },
  });
  const dayByNumber = new Map(tripDays.map((day) => [day.dayNumber, day.id]));

  const uniquePlaces = new Map<
    string,
    ApplyPlanInput["days"][number]["items"][number]["place"]
  >();
  for (const day of plan.days) {
    if (!dayByNumber.has(day.dayNumber)) continue;
    for (const item of day.items)
      uniquePlaces.set(item.place.placeId, item.place);
  }

  const saved = new Map<string, string>();
  const entries = Array.from(uniquePlaces.values());
  for (let index = 0; index < entries.length; index += 8) {
    const chunk = entries.slice(index, index + 8);
    const results = await Promise.all(chunk.map((place) => upsertPlace(place)));
    chunk.forEach((place, position) =>
      saved.set(place.placeId, results[position].id),
    );
  }

  let created = 0;
  await prisma.$transaction(async (tx) => {
    for (const day of plan.days) {
      const dayId = dayByNumber.get(day.dayNumber);
      if (!dayId || day.items.length === 0) continue;

      let start = 0;
      if (plan.replace) {
        await tx.itineraryItem.deleteMany({ where: { tripDayId: dayId } });
      } else {
        const last = await tx.itineraryItem.aggregate({
          where: { tripDayId: dayId },
          _max: { sortOrder: true },
        });
        start = (last._max.sortOrder ?? -1) + 1;
      }

      const data = day.items.flatMap((item, position) => {
        const placeId = saved.get(item.place.placeId);
        if (!placeId) return [];
        return [
          {
            tripDayId: dayId,
            placeId,
            startTime: item.startTime,
            endTime: item.endTime,
            notes: item.notes ?? null,
            sortOrder: start + position,
          },
        ];
      });
      await tx.itineraryItem.createMany({ data });
      created += data.length;
    }
  });

  return created;
}
