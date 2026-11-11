import type { PlaceCategoryValue } from "@/data/places";

export type PlaceDTO = {
  placeId: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  category: PlaceCategoryValue;
};

export type PlaceDetailDTO = PlaceDTO & {
  websiteUri: string | null;
  phone: string | null;
  openingHours: string | null;
};

export type PlaceSuggestionDTO = {
  key: string;
  primaryText: string;
  secondaryText: string | null;
  latitude: number;
  longitude: number;
};

export type SavedPlaceDTO = {
  id: string;
  placeId: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  category: PlaceCategoryValue;
};

export type FavoriteDTO = {
  id: string;
  createdAt: string;
  place: SavedPlaceDTO;
};

export type ItineraryItemDTO = {
  id: string;
  tripDayId: string;
  placeId: string | null;
  title: string | null;
  startTime: string | null;
  endTime: string | null;
  sortOrder: number;
  notes: string | null;
  place: SavedPlaceDTO | null;
};
