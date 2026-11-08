export const TRIP_STATUSES = ["PLANNING", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"] as const;
export type TripStatusValue = (typeof TRIP_STATUSES)[number];

export const TRIP_STATUS_LABELS: Record<TripStatusValue, string> = {
  PLANNING: "Perencanaan",
  UPCOMING: "Akan Datang",
  ONGOING: "Berlangsung",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const TRIP_STATUS_STYLES: Record<TripStatusValue, string> = {
  PLANNING: "bg-neutral-100 text-neutral-700",
  UPCOMING: "bg-sky-50 text-sky-700",
  ONGOING: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-teal-50 text-teal-800",
  CANCELLED: "bg-red-50 text-red-700",
};

export const MAX_TRIP_DAYS = 60;