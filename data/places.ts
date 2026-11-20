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

export const FILTERABLE_CATEGORIES = PLACE_CATEGORIES.filter(
  (value): value is Exclude<PlaceCategoryValue, "OTHER"> => value !== "OTHER",
);

export const PLACE_ALIASES: Record<string, string[]> = {
  solo: ["Surakarta"],
  surakarta: ["Solo"],
  jogja: ["Yogyakarta"],
  jogjakarta: ["Yogyakarta"],
  yogya: ["Yogyakarta"],
  dki: ["Jakarta"],
  diy: ["Yogyakarta"],
  "dki jakarta": ["Jakarta"],
  "jawa barat": ["West Java"],
  "jawa tengah": ["Central Java"],
  "bandung barat": ["West Bandung"],
};

export function searchTerms(text: string): string[] {
  const clean = text.trim();
  return [clean, ...(PLACE_ALIASES[clean.toLowerCase()] ?? [])];
}

export const PLACE_PROVIDER = "gmaps";

export const SEARCH_RADIUS_OPTIONS = [
  { value: 5000, label: "5 km" },
  { value: 15000, label: "15 km" },
  { value: 30000, label: "30 km" },
  { value: 50000, label: "50 km" },
] as const;

export const DEFAULT_SEARCH_RADIUS = 15000;
