import { TRIP_STATUS_LABELS, TRIP_STATUS_STYLES, type TripStatusValue } from "@/data/trip";
import { cn } from "@/lib/utils";

export function TripStatusBadge({ status }: { status: TripStatusValue }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", TRIP_STATUS_STYLES[status])}>
      {TRIP_STATUS_LABELS[status]}
    </span>
  );
}