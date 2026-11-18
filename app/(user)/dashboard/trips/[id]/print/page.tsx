import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { requirePageUser } from "@/lib/permissions";
import { loadTripOrNotFound } from "@/lib/page-helpers";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/fragment/print-button";
import { PLACE_CATEGORY_LABELS } from "@/data/places";
import { formatDateID, formatLongDateID, toDateInput } from "@/utils/date";
import { formatIDR } from "@/utils/format";

type PrintPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PrintPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);
  return { title: `Itinerary ${trip.title}` };
}

export default async function PrintPage({ params }: PrintPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);

  const days = await prisma.tripDay.findMany({
    where: { tripId: trip.id },
    orderBy: { dayNumber: "asc" },
    include: {
      items: { orderBy: { sortOrder: "asc" }, include: { place: true } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/dashboard/trips/${trip.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Kembali ke perjalanan
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/v1/trips/${trip.id}/calendar`}
            download
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <CalendarPlus className="size-4" />
            Unduh kalender (.ics)
          </a>
          <PrintButton />
        </div>
      </div>

      <article className="space-y-8 rounded-2xl border border-neutral-200 bg-white p-8 print:rounded-none print:border-0 print:p-0">
        <header className="space-y-3 border-b border-neutral-200 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            {trip.title}
          </h1>
          <p className="text-lg text-neutral-700">{trip.destination}</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-neutral-600 sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-400">
                Tanggal
              </dt>
              <dd>
                {formatDateID(trip.startDate)} – {formatDateID(trip.endDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-400">
                Durasi
              </dt>
              <dd>{days.length} hari</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-400">
                Traveler
              </dt>
              <dd>{trip.travelers} orang</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-400">
                Estimasi budget
              </dt>
              <dd>{formatIDR(trip.budget)}</dd>
            </div>
          </dl>
          {trip.description ? (
            <p className="whitespace-pre-line text-sm text-neutral-600">
              {trip.description}
            </p>
          ) : null}
        </header>

        {days.map((day) => (
          <section key={day.id} className="space-y-3 print:break-inside-avoid">
            <div className="flex items-baseline justify-between gap-4 border-b border-neutral-200 pb-2">
              <h2 className="text-lg font-semibold text-neutral-900">
                Hari {day.dayNumber}
              </h2>
              <p className="text-sm text-neutral-500">
                {formatLongDateID(toDateInput(day.date))}
              </p>
            </div>

            {day.items.length === 0 ? (
              <p className="text-sm text-neutral-400">Belum ada rencana.</p>
            ) : (
              <ol className="space-y-3">
                {day.items.map((item) => (
                  <li key={item.id} className="flex gap-4 text-sm">
                    <span
                      className="mt-1 size-4 shrink-0 rounded border border-neutral-400"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="font-medium text-neutral-900">
                        {item.startTime ? (
                          <span className="mr-2 text-neutral-500">
                            {item.startTime}
                            {item.endTime ? `–${item.endTime}` : ""}
                          </span>
                        ) : null}
                        {item.place?.name ?? item.title ?? "Kegiatan"}
                        {item.place ? (
                          <span className="ml-2 text-xs font-normal text-neutral-400">
                            {PLACE_CATEGORY_LABELS[item.place.category]}
                          </span>
                        ) : null}
                      </p>
                      {item.place?.address ? (
                        <p className="text-neutral-500">{item.place.address}</p>
                      ) : null}
                      {item.notes ? (
                        <p className="whitespace-pre-line text-neutral-600">
                          {item.notes}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}

        <footer className="border-t border-neutral-200 pt-4 text-center text-xs text-neutral-400">
          Dibuat dengan Triply · Peta © OpenStreetMap contributors
        </footer>
      </article>
    </div>
  );
}
