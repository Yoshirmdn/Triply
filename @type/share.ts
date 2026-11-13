import type { PlaceCategoryValue } from "@/data/places";
import type { TripStatusValue } from "@/data/trip";

export type ShareStateDTO = {
  isPublic: boolean;
  token: string | null;
  path: string | null;
};

export type PublicItemDTO = {
  id: string;
  title: string | null;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  place: {
    name: string;
    address: string | null;
    latitude: number;
    longitude: number;
    category: PlaceCategoryValue;
  } | null;
};

export type PublicDayDTO = {
  id: string;
  dayNumber: number;
  date: string;
  items: PublicItemDTO[];
};

export type PublicTripDTO = {
  title: string;
  destination: string;
  description: string | null;
  startDate: string;
  endDate: string;
  travelers: number;
  status: TripStatusValue;
  ownerName: string;
  days: PublicDayDTO[];
};
