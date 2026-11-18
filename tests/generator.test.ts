import { describe, expect, it } from "vitest";
import {
  clusterBalanced,
  formatMinutes,
  generateItinerary,
  orderByNearest,
  pickActivities,
} from "@/lib/itinerary-generator";
import { distanceMeters } from "@/lib/photo-match";
import type { PlaceCategoryValue } from "@/data/places";
import type { PlaceDTO } from "@/@type/place";

let counter = 0;
function place(
  category: PlaceCategoryValue,
  latitude: number,
  longitude: number,
): PlaceDTO {
  counter += 1;
  return {
    placeId: `p${counter}-${category}`,
    name: `${category} ${counter}`,
    address: null,
    latitude,
    longitude,
    category,
  };
}

function pool(): PlaceDTO[] {
  const list: PlaceDTO[] = [];
  const zones: [number, number][] = [
    [-7.8, 110.3],
    [-7.8, 110.5],
    [-7.6, 110.4],
  ];
  for (const [lat, lng] of zones) {
    for (let index = 0; index < 4; index += 1) {
      const offset = index * 0.002;
      list.push(place("ATTRACTION", lat + offset, lng + offset));
      list.push(place("NATURE", lat - offset, lng + offset));
      list.push(place("MUSEUM", lat + offset, lng - offset));
      list.push(place("RESTAURANT", lat + offset / 2, lng));
      list.push(place("CAFE", lat, lng + offset / 2));
    }
  }
  list.push(place("HOTEL", -7.8, 110.4));
  list.push(place("OTHER", -7.8, 110.4));
  return list;
}

describe("itinerary generator", () => {
  it("formats minutes as HH:mm and clamps to the day", () => {
    expect(formatMinutes(9 * 60 + 5)).toBe("09:05");
    expect(formatMinutes(99999)).toBe("23:59");
    expect(formatMinutes(-5)).toBe("00:00");
  });

  it("never places hotels or other categories", () => {
    const plan = generateItinerary({
      places: pool(),
      days: 3,
      style: "BALANCED",
      pace: "NORMAL",
    });
    const categories = plan.days.flatMap((day) =>
      day.items.map((item) => item.place.category),
    );
    expect(categories).not.toContain("HOTEL");
    expect(categories).not.toContain("OTHER");
  });

  it("fills the requested number of activities per pace", () => {
    const plan = generateItinerary({
      places: pool(),
      days: 3,
      style: "BALANCED",
      pace: "NORMAL",
    });
    expect(plan.requested).toBe(9);
    expect(plan.used).toBe(9);
    for (const day of plan.days) {
      expect(day.items.filter((item) => item.kind === "activity")).toHaveLength(
        3,
      );
    }
  });

  it("does not repeat a place and keeps times valid and increasing", () => {
    const plan = generateItinerary({
      places: pool(),
      days: 3,
      style: "FOOD",
      pace: "PACKED",
    });
    const ids = plan.days.flatMap((day) =>
      day.items.map((item) => item.place.placeId),
    );
    expect(new Set(ids).size).toBe(ids.length);
    for (const day of plan.days) {
      let previousEnd = "00:00";
      for (const item of day.items) {
        expect(item.startTime).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
        expect(item.endTime).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
        expect(item.endTime >= item.startTime).toBe(true);
        expect(item.startTime >= previousEnd).toBe(true);
        previousEnd = item.endTime;
      }
    }
  });

  it("schedules lunch no earlier than noon and dinner no earlier than 18:30", () => {
    const plan = generateItinerary({
      places: pool(),
      days: 2,
      style: "FOOD",
      pace: "NORMAL",
    });
    for (const day of plan.days) {
      const meals = day.items.filter((item) => item.kind === "meal");
      expect(meals.length).toBe(3);
      expect(meals[0].startTime >= "12:00").toBe(true);
      expect(meals[meals.length - 1].startTime >= "18:30").toBe(true);
      expect(meals[0].notes).toBe("Makan siang");
    }
  });

  it("groups nearby places into the same day", () => {
    const west = [
      place("ATTRACTION", -7.8, 110.3),
      place("ATTRACTION", -7.801, 110.301),
      place("ATTRACTION", -7.802, 110.302),
    ];
    const east = [
      place("ATTRACTION", -7.8, 110.9),
      place("ATTRACTION", -7.801, 110.901),
      place("ATTRACTION", -7.802, 110.902),
    ];
    const groups = clusterBalanced(
      [west[0], east[0], west[1], east[1], west[2], east[2]],
      2,
    );
    const sets = groups.map(
      (group) => new Set(group.map((item) => item.longitude < 110.6)),
    );
    expect(groups.map((group) => group.length)).toEqual([3, 3]);
    for (const set of sets) expect(set.size).toBe(1);
  });

  it("gives balanced group sizes", () => {
    const items = Array.from({ length: 7 }, (_, index) =>
      place("ATTRACTION", -7.8 + index * 0.01, 110.3),
    );
    const sizes = clusterBalanced(items, 3).map((group) => group.length);
    expect(sizes.reduce((sum, value) => sum + value, 0)).toBe(7);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it("follows the style when picking activities", () => {
    const places = pool();
    const nature = pickActivities(places, 6, "NATURE").filter(
      (item) => item.category === "NATURE",
    ).length;
    const culture = pickActivities(places, 6, "CULTURE").filter(
      (item) => item.category === "NATURE",
    ).length;
    expect(nature).toBeGreaterThan(culture);
    const museums = pickActivities(places, 6, "CULTURE").filter(
      (item) => item.category === "MUSEUM",
    ).length;
    expect(museums).toBeGreaterThanOrEqual(2);
  });

  it("orders a day by nearest neighbour and gives a shorter path than a zigzag", () => {
    const line = [
      place("ATTRACTION", 0, 0),
      place("ATTRACTION", 0, 0.3),
      place("ATTRACTION", 0, 0.1),
      place("ATTRACTION", 0, 0.2),
    ];
    const ordered = orderByNearest(line);
    const length = (items: PlaceDTO[]) =>
      items
        .slice(1)
        .reduce(
          (sum, item, index) =>
            sum +
            distanceMeters(
              items[index].latitude,
              items[index].longitude,
              item.latitude,
              item.longitude,
            ),
          0,
        );
    expect(length(ordered)).toBeLessThan(length(line));
  });

  it("reports a shortfall when there are not enough places", () => {
    const few = [
      place("ATTRACTION", -7.8, 110.3),
      place("NATURE", -7.81, 110.31),
    ];
    const plan = generateItinerary({
      places: few,
      days: 3,
      style: "BALANCED",
      pace: "NORMAL",
    });
    expect(plan.requested).toBe(9);
    expect(plan.used).toBe(2);
    expect(plan.days).toHaveLength(3);
  });

  it("returns empty days when there are no places", () => {
    const plan = generateItinerary({
      places: [],
      days: 2,
      style: "BALANCED",
      pace: "RELAXED",
    });
    expect(plan.used).toBe(0);
    expect(plan.days.every((day) => day.items.length === 0)).toBe(true);
  });

  it("is deterministic", () => {
    const places = pool();
    const a = generateItinerary({
      places,
      days: 3,
      style: "BALANCED",
      pace: "NORMAL",
    });
    const b = generateItinerary({
      places,
      days: 3,
      style: "BALANCED",
      pace: "NORMAL",
    });
    expect(a).toEqual(b);
  });
});
