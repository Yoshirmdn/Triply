export const EXPENSE_CATEGORIES = [
  "TRANSPORTATION",
  "ACCOMMODATION",
  "FOOD_DRINKS",
  "ATTRACTIONS_TICKETS",
  "SHOPPING",
  "OTHER",
] as const;

export type ExpenseCategoryValue = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategoryValue, string> = {
  TRANSPORTATION: "Transportasi",
  ACCOMMODATION: "Akomodasi",
  FOOD_DRINKS: "Makan & Minum",
  ATTRACTIONS_TICKETS: "Tiket & Wisata",
  SHOPPING: "Belanja",
  OTHER: "Lainnya",
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategoryValue, string> = {
  TRANSPORTATION: "#0f766e",
  ACCOMMODATION: "#1d4ed8",
  FOOD_DRINKS: "#d97706",
  ATTRACTIONS_TICKETS: "#7c3aed",
  SHOPPING: "#db2777",
  OTHER: "#6b7280",
};

export const MAX_EXPENSE_AMOUNT = 999999999999;