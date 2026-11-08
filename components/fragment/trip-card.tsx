import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { TripStatusBadge } from "@/components/fragment/trip-status-badge";
import { formatIDR } from "@/utils/format";
import { formatDateID } from "@/utils/date";
import type { TripDTO } from "@/@type/trip";

export function TripCard({ trip }: { trip: TripDTO }) {
  return (
    <Link
      href={`/dashboard/trips/${trip.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-teal-300 hover:shadow-sm"
    >
      {trip.coverImage ? (
        <img src={trip.coverImage} alt={trip.title} className="h-36 w-full object-cover" />
      ) : (
        <div className="h-2 bg-teal-800" />
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-semibold text-neutral-900 group-hover:text-teal-900">{trip.title}</h3>
          <TripStatusBadge status={trip.status} />
        </div>
        <div className="space-y-1.5 text-sm text-neutral-600">
          <p className="flex items-center gap-2">
            <MapPin className="size-4 text-neutral-400" />
            <span className="truncate">{trip.destination}</span>
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4 text-neutral-400" />
            {formatDateID(trip.startDate)} – {formatDateID(trip.endDate)}
          </p>
          <p className="flex items-center gap-2">
            <Users className="size-4 text-neutral-400" />
            {trip.travelers} traveler
          </p>
        </div>
        <p className="mt-auto pt-1 text-sm font-medium text-neutral-900">{formatIDR(trip.budget)}</p>
      </div>
    </Link>
  );
}