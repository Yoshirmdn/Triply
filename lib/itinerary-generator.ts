import { distanceMeters } from "@/lib/photo-match";
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_DURATION_MINUTES,
  MEAL_CONFIG,
  PACE_ACTIVITIES,
  PACE_DURATION_SCALE,
  PACE_START_MINUTES,
  STYLE_MEALS,
  STYLE_WEIGHTS,
  TRAVEL_BUFFER_MINUTES,
  type ActivityCategory,
  type MealSlot,
  type TripPaceValue,
  type TripStyleValue,
} from "@/data/generator";
import type { PlaceDTO } from "@/@type/place";
import type {
  GeneratedDayDTO,
  GeneratedItemDTO,
  GeneratedPlanDTO,
} from "@/@type/generator";

type GeneratorInput = {
  places: PlaceDTO[];
  days: number;
  style: TripStyleValue;
  pace: TripPaceValue;
};

type Coordinate = { latitude: number; longitude: number };

function isActivity(category: string): category is ActivityCategory {
  return (ACTIVITY_CATEGORIES as readonly string[]).includes(category);
}

function meters(a: Coordinate, b: Coordinate): number {
  return distanceMeters(a.latitude, a.longitude, b.latitude, b.longitude);
}

function centroid(points: Coordinate[]): Coordinate {
  const total = points.reduce(
    (sum, point) => ({
      latitude: sum.latitude + point.latitude,
      longitude: sum.longitude + point.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );
  return {
    latitude: total.latitude / points.length,
    longitude: total.longitude / points.length,
  };
}

function dedupe(places: PlaceDTO[]): PlaceDTO[] {
  const seen = new Set<string>();
  const result: PlaceDTO[] = [];
  for (const place of places) {
    if (seen.has(place.placeId)) continue;
    seen.add(place.placeId);
    result.push(place);
  }
  return result;
}

export function pickActivities(
  places: PlaceDTO[],
  count: number,
  style: TripStyleValue,
): PlaceDTO[] {
  const weights = STYLE_WEIGHTS[style];
  const buckets = new Map<ActivityCategory, PlaceDTO[]>(
    ACTIVITY_CATEGORIES.map((category) => [category, []]),
  );
  for (const place of places) {
    if (isActivity(place.category)) buckets.get(place.category)?.push(place);
  }

  const picked: PlaceDTO[] = [];
  const counts = new Map<ActivityCategory, number>(
    ACTIVITY_CATEGORIES.map((category) => [category, 0]),
  );

  while (picked.length < count) {
    let best: ActivityCategory | null = null;
    let bestScore = -1;
    for (const category of ACTIVITY_CATEGORIES) {
      if (!buckets.get(category)?.length) continue;
      const score = weights[category] / ((counts.get(category) ?? 0) + 1);
      if (score > bestScore) {
        best = category;
        bestScore = score;
      }
    }
    if (!best) break;
    const next = buckets.get(best)?.shift();
    if (!next) break;
    picked.push(next);
    counts.set(best, (counts.get(best) ?? 0) + 1);
  }

  return picked;
}

function assignBalanced(
  items: PlaceDTO[],
  centers: Coordinate[],
  capacities: number[],
): PlaceDTO[][] {
  const pairs: { item: number; center: number; distance: number }[] = [];
  items.forEach((item, itemIndex) => {
    centers.forEach((center, centerIndex) => {
      pairs.push({
        item: itemIndex,
        center: centerIndex,
        distance: meters(item, center),
      });
    });
  });
  pairs.sort(
    (a, b) => a.distance - b.distance || a.item - b.item || a.center - b.center,
  );

  const groups: PlaceDTO[][] = centers.map(() => []);
  const assigned = new Set<number>();
  for (const pair of pairs) {
    if (assigned.has(pair.item)) continue;
    if (groups[pair.center].length >= capacities[pair.center]) continue;
    groups[pair.center].push(items[pair.item]);
    assigned.add(pair.item);
  }
  return groups;
}

export function clusterBalanced(items: PlaceDTO[], k: number): PlaceDTO[][] {
  if (k <= 0) return [];
  if (items.length === 0) return Array.from({ length: k }, () => []);
  if (k === 1) return [items.slice()];

  const base = Math.floor(items.length / k);
  const extra = items.length % k;
  const capacities = Array.from(
    { length: k },
    (_, index) => base + (index < extra ? 1 : 0),
  );

  const middle = centroid(items);
  const first = items.reduce(
    (best, item) => (meters(item, middle) > meters(best, middle) ? item : best),
    items[0],
  );
  const seeds: PlaceDTO[] = [first];
  while (seeds.length < Math.min(k, items.length)) {
    let farthest = items[0];
    let farthestDistance = -1;
    for (const item of items) {
      const nearest = Math.min(...seeds.map((seed) => meters(item, seed)));
      if (nearest > farthestDistance) {
        farthest = item;
        farthestDistance = nearest;
      }
    }
    seeds.push(farthest);
  }

  let centers: Coordinate[] = Array.from({ length: k }, (_, index) => {
    const seed = seeds[Math.min(index, seeds.length - 1)];
    return { latitude: seed.latitude, longitude: seed.longitude };
  });

  let groups = assignBalanced(items, centers, capacities);
  for (let round = 0; round < 4; round += 1) {
    centers = groups.map((group, index) =>
      group.length > 0 ? centroid(group) : centers[index],
    );
    groups = assignBalanced(items, centers, capacities);
  }
  return groups;
}

function orderClusters(groups: PlaceDTO[][]): PlaceDTO[][] {
  const filled = groups.filter((group) => group.length > 0);
  const empty = groups.filter((group) => group.length === 0);
  if (filled.length <= 1) return [...filled, ...empty];

  const centers = filled.map((group) => centroid(group));
  const middle = centroid(centers);
  let current = 0;
  for (let index = 1; index < centers.length; index += 1) {
    if (meters(centers[index], middle) > meters(centers[current], middle))
      current = index;
  }

  const order = [current];
  const remaining = new Set(centers.keys());
  remaining.delete(current);
  while (remaining.size > 0) {
    let next = -1;
    let nextDistance = Infinity;
    for (const candidate of remaining) {
      const distance = meters(
        centers[order[order.length - 1]],
        centers[candidate],
      );
      if (distance < nextDistance) {
        next = candidate;
        nextDistance = distance;
      }
    }
    order.push(next);
    remaining.delete(next);
  }

  return [...order.map((index) => filled[index]), ...empty];
}

export function orderByNearest(items: PlaceDTO[]): PlaceDTO[] {
  if (items.length <= 2) return items.slice();
  const middle = centroid(items);
  const pool = items.slice();
  let startIndex = 0;
  for (let index = 1; index < pool.length; index += 1) {
    if (meters(pool[index], middle) > meters(pool[startIndex], middle))
      startIndex = index;
  }

  const path = [pool.splice(startIndex, 1)[0]];
  while (pool.length > 0) {
    const last = path[path.length - 1];
    let nextIndex = 0;
    for (let index = 1; index < pool.length; index += 1) {
      if (meters(last, pool[index]) < meters(last, pool[nextIndex]))
        nextIndex = index;
    }
    path.push(pool.splice(nextIndex, 1)[0]);
  }
  return path;
}

function takeMeal(
  pool: PlaceDTO[],
  slot: MealSlot,
  anchor: Coordinate | null,
): PlaceDTO | null {
  if (pool.length === 0) return null;
  const preferred = MEAL_CONFIG[slot].prefer;
  const preferredPool = pool.filter((place) => place.category === preferred);
  const candidates = preferredPool.length > 0 ? preferredPool : pool;

  let best = candidates[0];
  if (anchor) {
    for (const candidate of candidates) {
      if (meters(candidate, anchor) < meters(best, anchor)) best = candidate;
    }
  }
  pool.splice(pool.indexOf(best), 1);
  return best;
}

export function formatMinutes(total: number): string {
  const clamped = Math.max(0, Math.min(total, 23 * 60 + 59));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

type Entry = {
  place: PlaceDTO;
  kind: "activity" | "meal";
  minStart: number;
  duration: number;
  notes: string | null;
};

function schedule(entries: Entry[], startMinutes: number): GeneratedItemDTO[] {
  let cursor = startMinutes;
  return entries.map((entry) => {
    const begin = Math.min(Math.max(cursor, entry.minStart), 23 * 60);
    const end = Math.min(begin + entry.duration, 23 * 60 + 59);
    cursor = begin + entry.duration + TRAVEL_BUFFER_MINUTES;
    return {
      place: entry.place,
      kind: entry.kind,
      startTime: formatMinutes(begin),
      endTime: formatMinutes(end),
      notes: entry.notes,
    };
  });
}

function pathKm(items: GeneratedItemDTO[]): number {
  let total = 0;
  for (let index = 1; index < items.length; index += 1) {
    total += meters(items[index - 1].place, items[index].place);
  }
  return Math.round(total / 100) / 10;
}

export function generateItinerary(input: GeneratorInput): GeneratedPlanDTO {
  const places = dedupe(input.places);
  const days = Math.max(1, Math.floor(input.days));
  const perDay = PACE_ACTIVITIES[input.pace];
  const requested = days * perDay;

  const activities = pickActivities(places, requested, input.style);
  const used = new Set(activities.map((place) => place.placeId));
  const foodPool = places.filter(
    (place) =>
      (place.category === "RESTAURANT" || place.category === "CAFE") &&
      !used.has(place.placeId),
  );

  const clusters = orderClusters(clusterBalanced(activities, days)).map(
    (group) => orderByNearest(group),
  );
  const everything = places.length > 0 ? centroid(places) : null;

  const meals: Map<number, Map<MealSlot, PlaceDTO>> = new Map();
  for (const slot of STYLE_MEALS[input.style]) {
    clusters.forEach((group, dayIndex) => {
      const anchor =
        group.length > 0
          ? slot === "DINNER"
            ? group[group.length - 1]
            : centroid(group)
          : everything;
      const chosen = takeMeal(foodPool, slot, anchor);
      if (!chosen) return;
      const dayMeals = meals.get(dayIndex) ?? new Map<MealSlot, PlaceDTO>();
      dayMeals.set(slot, chosen);
      meals.set(dayIndex, dayMeals);
    });
  }

  const scale = PACE_DURATION_SCALE[input.pace];
  const resultDays: GeneratedDayDTO[] = clusters.map((group, dayIndex) => {
    const half = Math.ceil(group.length / 2);
    const entries: Entry[] = [];

    const activityEntry = (place: PlaceDTO): Entry => {
      const base = isActivity(place.category)
        ? ACTIVITY_DURATION_MINUTES[place.category]
        : 90;
      return {
        place,
        kind: "activity",
        minStart: 0,
        duration: Math.round((base * scale) / 5) * 5,
        notes: null,
      };
    };
    const mealEntry = (slot: MealSlot): Entry | null => {
      const place = meals.get(dayIndex)?.get(slot);
      if (!place) return null;
      const config = MEAL_CONFIG[slot];
      return {
        place,
        kind: "meal",
        minStart: config.minStart,
        duration: config.duration,
        notes: config.note,
      };
    };

    for (const place of group.slice(0, half))
      entries.push(activityEntry(place));
    const lunch = mealEntry("LUNCH");
    if (lunch) entries.push(lunch);
    for (const place of group.slice(half)) entries.push(activityEntry(place));
    for (const slot of ["SNACK", "DINNER"] as const) {
      const entry = mealEntry(slot);
      if (entry) entries.push(entry);
    }

    const items = schedule(entries, PACE_START_MINUTES[input.pace]);
    return { dayNumber: dayIndex + 1, distanceKm: pathKm(items), items };
  });

  return { days: resultDays, requested, used: activities.length };
}
