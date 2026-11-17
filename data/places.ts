export const PLACE_CATEGORIES = [
  "ATTRACTION",
  "RESTAURANT",
  "CAFE",
  "HOTEL",
  "SHOPPING",
  "MUSEUM",
  "NATURE",
  "ENTERTAINMENT",
  "OTHER",
] as const;

export type PlaceCategoryValue = (typeof PLACE_CATEGORIES)[number];

export const PLACE_CATEGORY_LABELS: Record<PlaceCategoryValue, string> = {
  ATTRACTION: "Wisata",
  RESTAURANT: "Restoran",
  CAFE: "Kafe",
  HOTEL: "Penginapan",
  SHOPPING: "Belanja",
  MUSEUM: "Museum",
  NATURE: "Alam",
  ENTERTAINMENT: "Hiburan",
  OTHER: "Lainnya",
};

export const PLACE_CATEGORY_GEOAPIFY: Record<
  Exclude<PlaceCategoryValue, "OTHER">,
  string
> = {
  ATTRACTION: "tourism,heritage",
  RESTAURANT: "catering.restaurant",
  CAFE: "catering.cafe",
  HOTEL: "accommodation",
  SHOPPING: "commercial.shopping_mall",
  MUSEUM: "entertainment.museum",
  NATURE: "beach,national_park,natural.mountain,leisure.park",
  ENTERTAINMENT: "entertainment",
};

export const FILTERABLE_CATEGORIES = PLACE_CATEGORIES.filter(
  (value): value is Exclude<PlaceCategoryValue, "OTHER"> => value !== "OTHER",
);

export const ALL_GEOAPIFY_CATEGORIES = FILTERABLE_CATEGORIES.map(
  (value) => PLACE_CATEGORY_GEOAPIFY[value],
).join(",");

export const PLACE_PROVIDER = "geoapify";

export const SEARCH_RADIUS_OPTIONS = [
  { value: 5000, label: "5 km" },
  { value: 15000, label: "15 km" },
  { value: 30000, label: "30 km" },
  { value: 50000, label: "50 km" },
] as const;

export const DEFAULT_SEARCH_RADIUS = 15000;
