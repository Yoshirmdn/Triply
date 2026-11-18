import type { PlaceDTO } from "@/@type/place";

export type GeneratedItemDTO = {
  place: PlaceDTO;
  kind: "activity" | "meal";
  startTime: string;
  endTime: string;
  notes: string | null;
};

export type GeneratedDayDTO = {
  dayNumber: number;
  distanceKm: number;
  items: GeneratedItemDTO[];
};

export type GeneratedPlanDTO = {
  days: GeneratedDayDTO[];
  requested: number;
  used: number;
};
