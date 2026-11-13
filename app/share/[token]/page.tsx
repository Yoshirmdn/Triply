import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { siteConfig } from "@/data/site";
import { getPublicTrip } from "@/lib/share-helpers";
import { PublicTripView } from "@/components/fragment/public-trip-view";
import { TripStatusBadge } from "@/components/fragment/trip-status-badge";
import { formatDateID } from "@/utils/date";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: SharePageProps) {
  const { token } = await params;
  const trip = await getPublicTrip(token);
  if (!trip)
    return {
      title: "Tautan tidak ditemukan",
      robots: { index: false, follow: false },
    };
  return {
    title: trip.title,
    description: `Itinerary ${trip.destination} oleh ${trip.ownerName}`,
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const trip = await getPublicTrip(token);
  if (!trip) notFound();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-teal-900"
          >
            {siteConfig.name}
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
          >
            Buat rencanamu
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              {trip.title}
            </h1>
            <TripStatusBadge status={trip.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4 text-neutral-400" />
              {trip.destination}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-neutral-400" />
              {formatDateID(trip.startDate)} – {formatDateID(trip.endDate)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="size-4 text-neutral-400" />
              {trip.travelers} orang
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            Dibagikan oleh {trip.ownerName}
          </p>
          {trip.description ? (
            <p className="max-w-3xl whitespace-pre-line text-neutral-600">
              {trip.description}
            </p>
          ) : null}
        </div>

        <PublicTripView days={trip.days} />
      </main>

      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-400">
        {siteConfig.name} · {siteConfig.tagline} · Peta © OpenStreetMap
        contributors
      </footer>
    </div>
  );
}
