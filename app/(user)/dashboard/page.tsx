import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePageUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { accessWhere, memberSelect, serializeTrip } from "@/lib/trip-helpers";
import { StatCard } from "@/components/fragment/stat-card";
import { TripCard } from "@/components/fragment/trip-card";
import { formatIDR } from "@/utils/format";
import { todayUTC } from "@/utils/date";

export const metadata = { title: "Beranda" };

export default async function DashboardPage() {
  const actor = await requirePageUser();
  const base = accessWhere(actor);
  const today = todayUTC();

  const [totalTrips, upcomingTrips, completedTrips, budget, recent] = await Promise.all([
    prisma.trip.count({ where: base }),
    prisma.trip.count({
      where: { ...base, startDate: { gte: today }, status: { in: ["PLANNING", "UPCOMING"] } },
    }),
    prisma.trip.count({ where: { ...base, status: "COMPLETED" } }),
    prisma.trip.aggregate({ where: { ...base, status: { not: "CANCELLED" } }, _sum: { budget: true } }),
    prisma.trip.findMany({
      where: base,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { members: memberSelect(actor.id) },
    }),
  ]);

  const data = {
    totalTrips,
    upcomingTrips,
    completedTrips,
    totalBudget: budget._sum.budget?.toString() ?? "0",
    recentTrips: recent.map((trip) => serializeTrip(trip, actor)),
  };
  const firstName = (actor.name ?? actor.email).split(" ")[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Halo, {firstName}</h1>
          <p className="mt-1 text-sm text-neutral-500">Siap merencanakan perjalanan berikutnya?</p>
        </div>
        <Link
          href="/dashboard/trips/new"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900"
        >
          <Plus className="size-4" />
          Buat perjalanan
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total perjalanan" value={data.totalTrips} />
        <StatCard label="Akan datang" value={data.upcomingTrips} />
        <StatCard label="Selesai" value={data.completedTrips} />
        <StatCard label="Total estimasi budget" value={formatIDR(data.totalBudget)} hint="Tidak termasuk yang dibatalkan" />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Perjalanan terbaru</h2>
          <Link href="/dashboard/trips" className="text-sm font-medium text-teal-800 hover:underline">
            Lihat semua
          </Link>
        </div>

        {data.recentTrips.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            <p className="font-medium text-neutral-900">Belum ada perjalanan</p>
            <p className="mt-1 text-sm text-neutral-500">Mulai dengan membuat rencana perjalanan pertamamu.</p>
            <Link
              href="/dashboard/trips/new"
              className="mt-4 inline-flex rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
            >
              Buat perjalanan
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.recentTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}