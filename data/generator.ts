export const TRIP_STYLES = [
  "BALANCED",
  "FOOD",
  "NATURE",
  "CULTURE",
  "SHOPPING",
] as const;
export type TripStyleValue = (typeof TRIP_STYLES)[number];

export const TRIP_STYLE_LABELS: Record<TripStyleValue, string> = {
  BALANCED: "Seimbang",
  FOOD: "Kuliner",
  NATURE: "Alam",
  CULTURE: "Budaya",
  SHOPPING: "Belanja & hiburan",
};

export const TRIP_STYLE_HINTS: Record<TripStyleValue, string> = {
  BALANCED: "Campuran wisata, alam, dan museum",
  FOOD: "Lebih banyak waktu makan dan ngopi",
  NATURE: "Pantai, taman, gunung, dan ruang terbuka",
  CULTURE: "Museum, situs sejarah, dan warisan budaya",
  SHOPPING: "Mal, pusat hiburan, dan tempat ramai",
};

export const TRIP_PACES = ["RELAXED", "NORMAL", "PACKED"] as const;
export type TripPaceValue = (typeof TRIP_PACES)[number];

export const TRIP_PACE_LABELS: Record<TripPaceValue, string> = {
  RELAXED: "Santai",
  NORMAL: "Normal",
  PACKED: "Padat",
};

export const PACE_ACTIVITIES: Record<TripPaceValue, number> = {
  RELAXED: 2,
  NORMAL: 3,
  PACKED: 4,
};

export const PACE_START_MINUTES: Record<TripPaceValue, number> = {
  RELAXED: 9 * 60 + 30,
  NORMAL: 9 * 60,
  PACKED: 8 * 60 + 30,
};

export const PACE_DURATION_SCALE: Record<TripPaceValue, number> = {
  RELAXED: 1,
  NORMAL: 1,
  PACKED: 0.75,
};

export const ACTIVITY_CATEGORIES = [
  "ATTRACTION",
  "NATURE",
  "MUSEUM",
  "ENTERTAINMENT",
  "SHOPPING",
] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const ACTIVITY_DURATION_MINUTES: Record<ActivityCategory, number> = {
  ATTRACTION: 90,
  NATURE: 120,
  MUSEUM: 90,
  ENTERTAINMENT: 120,
  SHOPPING: 90,
};

export const STYLE_WEIGHTS: Record<
  TripStyleValue,
  Record<ActivityCategory, number>
> = {
  BALANCED: {
    ATTRACTION: 3,
    NATURE: 2,
    MUSEUM: 2,
    ENTERTAINMENT: 1,
    SHOPPING: 1,
  },
  FOOD: { ATTRACTION: 2, NATURE: 1, MUSEUM: 1, ENTERTAINMENT: 1, SHOPPING: 2 },
  NATURE: {
    ATTRACTION: 1,
    NATURE: 5,
    MUSEUM: 0.3,
    ENTERTAINMENT: 0.3,
    SHOPPING: 0.2,
  },
  CULTURE: {
    ATTRACTION: 3,
    NATURE: 0.5,
    MUSEUM: 4,
    ENTERTAINMENT: 0.5,
    SHOPPING: 0.5,
  },
  SHOPPING: {
    ATTRACTION: 1,
    NATURE: 0.5,
    MUSEUM: 0.5,
    ENTERTAINMENT: 3,
    SHOPPING: 4,
  },
};

export const MEAL_SLOTS = ["LUNCH", "SNACK", "DINNER"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const MEAL_CONFIG: Record<
  MealSlot,
  {
    prefer: "RESTAURANT" | "CAFE";
    minStart: number;
    duration: number;
    note: string;
  }
> = {
  LUNCH: {
    prefer: "RESTAURANT",
    minStart: 12 * 60,
    duration: 60,
    note: "Makan siang",
  },
  SNACK: {
    prefer: "CAFE",
    minStart: 15 * 60 + 30,
    duration: 45,
    note: "Ngopi dan camilan",
  },
  DINNER: {
    prefer: "RESTAURANT",
    minStart: 18 * 60 + 30,
    duration: 75,
    note: "Makan malam",
  },
};

export const STYLE_MEALS: Record<TripStyleValue, MealSlot[]> = {
  BALANCED: ["LUNCH", "DINNER"],
  FOOD: ["LUNCH", "SNACK", "DINNER"],
  NATURE: ["LUNCH", "DINNER"],
  CULTURE: ["LUNCH", "DINNER"],
  SHOPPING: ["LUNCH", "DINNER"],
};

export const TRAVEL_BUFFER_MINUTES = 20;
export const MAX_GENERATE_DAYS = 14;
