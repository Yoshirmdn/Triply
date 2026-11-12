import Link from "next/link";
import { CalendarDays, MapPin, Pencil, Route, Users, Wallet } from "lucide-react";
import { requirePageUser } from "@/lib/permissions";
import { loadTripOrNotFound } from "@/lib/page-helpers";
import { TripStatusBadge } from "@/components/fragment/trip-status-badge";
import { DeleteTripButton } from "@/components/fragment/delete-trip-button";
import { formatIDR } from "@/utils/format";
import { formatDateID, formatLongDateID } from "@/utils/date";

type TripDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TripDetailPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);
  return { title: trip.title };
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);
  const plannedItems = trip.days.reduce((sum, day) => sum + day.itemCount, 0);

  return (
    <div className="space-y-8">
      <Link href="/dashboard/trips" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Semua perjalanan
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{trip.title}</h1>
            <TripStatusBadge status={trip.status} />
          </div>
          <p className="flex items-center gap-2 text-neutral-600">
            <MapPin className="size-4 text-neutral-400" />
            {trip.destination}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Link
            href={`/dashboard/trips/${trip.id}/planner`}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-900"
          >
            <Route className="size-4" />
            Planner
          </Link>
          {trip.canEdit ? (
            <Link
              href={`/dashboard/trips/${trip.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Pencil className="size-4" />
              Edit
            </Link>
          ) : null}
          {trip.isOwner ? <DeleteTripButton tripId={trip.id} title={trip.title} /> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <CalendarDays className="size-4" />
            Tanggal
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-900">
            {formatDateID(trip.startDate)} – {formatDateID(trip.endDate)}
          </p>
          <p className="mt-1 text-xs text-neutral-400">{trip.days.length} hari</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <Users className="size-4" />
            Traveler
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-900">{trip.travelers} orang</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <Wallet className="size-4" />
            Estimasi budget
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-900">{formatIDR(trip.budget)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-500">Itinerary</p>
          <p className="mt-2 text-sm font-medium text-neutral-900">{plannedItems} destinasi</p>
        </div>
      </div>

      {trip.description ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900">Deskripsi</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">{trip.description}</p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Ringkasan hari</h2>
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {trip.days.map((day) => (
            <li key={day.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <span className="font-medium text-neutral-900">Hari {day.dayNumber}</span>
              <span className="flex-1 text-neutral-600">{formatLongDateID(day.date)}</span>
              <span className="text-neutral-400">{day.itemCount} destinasi</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-neutral-400">Budget dan pengeluaran akan tersedia di tahap pengembangan berikutnya.</p>
      </section>
    </div>
  );
}