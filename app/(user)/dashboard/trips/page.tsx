import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePageUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { accessWhere, memberSelect, serializeTrip } from "@/lib/trip-helpers";
import { listTripsQuerySchema } from "@/lib/validations/trip.schema";
import { TRIP_STATUSES, TRIP_STATUS_LABELS } from "@/data/trip";
import { TripCard } from "@/components/fragment/trip-card";
import { cn } from "@/lib/utils";

export const metadata = { title: "Perjalanan" };

type TripsPageProps = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

function buildHref(status: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/dashboard/trips?${query}` : "/dashboard/trips";
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const actor = await requirePageUser();
  const raw = await searchParams;
  const parsed = listTripsQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : listTripsQuerySchema.parse({});
  const where = {
    ...accessWhere(actor),
    ...(query.status ? { status: query.status } : {}),
  };

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: { startDate: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { members: memberSelect(actor.id) },
    }),
    prisma.trip.count({ where }),
  ]);

  const result = {
    items: trips.map((trip) => serializeTrip(trip, actor)),
    total,
    pageSize: query.pageSize,
  };
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  const tabs = [
    { value: undefined, label: "Semua" },
    ...TRIP_STATUSES.map((value) => ({
      value,
      label: TRIP_STATUS_LABELS[value],
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Perjalanan
        </h1>
        <Link
          href="/dashboard/trips/new"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900"
        >
          <Plus className="size-4" />
          Buat perjalanan
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={buildHref(tab.value, 1)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition",
              query.status === tab.value
                ? "border-teal-800 bg-teal-800 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="font-medium text-neutral-900">Tidak ada perjalanan</p>
          <p className="mt-1 text-sm text-neutral-500">
            {query.status
              ? "Tidak ada perjalanan dengan status ini."
              : "Buat perjalanan pertamamu."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          {query.page > 1 ? (
            <Link
              href={buildHref(query.status, query.page - 1)}
              className="font-medium text-teal-800 hover:underline"
            >
              Sebelumnya
            </Link>
          ) : (
            <span />
          )}
          <span className="text-neutral-500">
            Halaman {query.page} dari {totalPages}
          </span>
          {query.page < totalPages ? (
            <Link
              href={buildHref(query.status, query.page + 1)}
              className="font-medium text-teal-800 hover:underline"
            >
              Berikutnya
            </Link>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}
