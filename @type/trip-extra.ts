import type { ChecklistKindValue, NoteKindValue } from "@/data/trip-extra";

export type ChecklistItemDTO = {
  id: string;
  kind: ChecklistKindValue;
  text: string;
  done: boolean;
  sortOrder: number;
};

export type TripNoteDTO = {
  id: string;
  kind: NoteKindValue;
  title: string;
  content: string | null;
  reference: string | null;
  url: string | null;
  dayNumber: number | null;
  updatedAt: string;
};

export type DayWeatherDTO = {
  date: string;
  code: number;
  max: number;
  min: number;
  rainChance: number | null;
};

export type DayInsightDTO = {
  dayId: string;
  dayNumber: number;
  date: string;
  weather: DayWeatherDTO | null;
  cost: number;
  pricedCount: number;
  unpricedCount: number;
};
