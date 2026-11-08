export const API_PREFIX = "/api/v1";

export const RECOMMENDATION_WEIGHTS = {
  category: 0.3,
  rating: 0.3,
  distance: 0.2,
  budget: 0.2,
} as const;

export const PLACE_CACHE_MAX_AGE_DAYS = 30;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const TRAVEL_MODES = ["driving", "walking", "cycling"] as const;
export type TravelMode = (typeof TRAVEL_MODES)[number];
