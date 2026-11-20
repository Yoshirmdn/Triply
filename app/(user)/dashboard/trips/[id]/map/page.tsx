import Link from "next/link";
import { requirePageUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { loadTripOrNotFound } from "@/lib/page-helpers";
import { serializeItineraryItem } from "@/lib/place-helpers";
import { getTripInsights } from "@/lib/trip-insights";
import { TripMapClient } from "@/components/fragment/trip-map-client";

type MapPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: MapPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);
  return { title: `Peta · ${trip.title}` };
}

export default async function TripMapPage({ params }: MapPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);

  const [items, insights] = await Promise.all([
    prisma.itineraryItem.findMany({
      where: { tripDay: { tripId: trip.id }, placeId: { not: null } },
      orderBy: [{ tripDay: { dayNumber: "asc" } }, { sortOrder: "asc" }],
      include: { place: true },
    }),
    getTripInsights(trip),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/dashboard/trips/${trip.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← {trip.title}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Peta perjalanan
        </h1>
        <p className="text-sm text-neutral-600">
          Lihat semua tempat atau pilih satu hari untuk melihat rute, cuaca, dan
          estimasi biaya.
        </p>
      </div>

      <TripMapClient
        tripId={trip.id}
        days={trip.days.map((day) => ({
          id: day.id,
          dayNumber: day.dayNumber,
          date: day.date,
        }))}
        items={items.map(serializeItineraryItem)}
        insights={insights}
      />
    </div>
  );
}
