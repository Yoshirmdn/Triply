import type { TripPaceValue, TripStyleValue } from "@/data/generator";

export type AccountDTO = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "SUPER_ADMIN" | "USER";
  defaultTravelers: number;
  defaultStyle: TripStyleValue;
  defaultPace: TripPaceValue;
};

export type AccountImpactDTO = {
  ownedTrips: number;
  sharedOwnedTrips: number;
};