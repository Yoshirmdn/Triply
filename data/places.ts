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
  ATTRACTION: "tourism",
  RESTAURANT: "catering.restaurant",
  CAFE: "catering.cafe",
  HOTEL: "accommodation.hotel",
  SHOPPING: "commercial.shopping_mall",
  MUSEUM: "entertainment.museum",
  NATURE: "natural,leisure.park",
  ENTERTAINMENT: "entertainment.zoo,entertainment.theme_park",
};

export const FILTERABLE_CATEGORIES = PLACE_CATEGORIES.filter(
  (value): value is Exclude<PlaceCategoryValue, "OTHER"> => value !== "OTHER",
);

export const ALL_GEOAPIFY_CATEGORIES = FILTERABLE_CATEGORIES.map(
  (value) => PLACE_CATEGORY_GEOAPIFY[value],
).join(",");

export const PLACE_PROVIDER = "geoapify";
