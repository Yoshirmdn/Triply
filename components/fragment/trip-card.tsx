import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { PlacePhoto } from "@/components/fragment/place-photo";
import { TripStatusBadge } from "@/components/fragment/trip-status-badge";
import { formatIDR } from "@/utils/format";
import { formatDateID } from "@/utils/date";
import type { TripDTO } from "@/@type/trip";

export function TripCard({ trip }: { trip: TripDTO }) {
  return (
    <Link
      href={`/dashboard/trips/${trip.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-teal-300 hover:shadow-md"
    >
      <PlacePhoto
        kind="destination"
        name={trip.destination}
        src={trip.coverImage || null}
        showCredit
        className="h-40 w-full"
        iconClassName="size-10"
      >
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute bottom-3 left-4 flex items-center gap-1.5 text-sm font-medium text-white">
          <MapPin className="size-4" />
          <span className="line-clamp-1">{trip.destination}</span>
        </span>
      </PlacePhoto>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-semibold text-neutral-900 group-hover:text-teal-900">{trip.title}</h3>
          <TripStatusBadge status={trip.status} />
        </div>
        <div className="space-y-1.5 text-sm text-neutral-600">
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