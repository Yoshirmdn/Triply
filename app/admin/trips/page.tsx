import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { listAdminTripsQuerySchema } from "@/lib/validations/admin.schema";
import { Pagination } from "@/components/fragment/pagination";
import { TripStatusBadge } from "@/components/fragment/trip-status-badge";
import { TRIP_STATUSES, TRIP_STATUS_LABELS } from "@/data/trip";
import { formatDateID } from "@/utils/date";
import { cn } from "@/lib/utils";

export const metadata = { title: "Perjalanan" };

type AdminTripsPageProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

export default async function AdminTripsPage({ searchParams }: AdminTripsPageProps) {
  await requirePageRole("SUPER_ADMIN");
  const raw = await searchParams;
  const parsed = listAdminTripsQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : listAdminTripsQuerySchema.parse({});

  const where = {
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" as const } },
            { destination: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.trip.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const inputClass = "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Perjalanan</h1>
        <p className="mt-1 text-sm text-neutral-600">{total} perjalanan dari semua pengguna.</p>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={query.q}
          placeholder="Cari judul atau destinasi"
          className={cn(inputClass, "min-w-56 flex-1")}
        />
        <select name="status" defaultValue={query.status ?? ""} className={inputClass}>
          <option value="">Semua status</option>
          {TRIP_STATUSES.map((value) => (
            <option key={value} value={value}>
              {TRIP_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full min-w-176 text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Perjalanan</th>
              <th className="px-4 py-3 font-medium">Pemilik</th>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {trips.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">
                  Tidak ada perjalanan yang cocok.
                </td>
              </tr>
            ) : null}
            {trips.map((trip) => (
              <tr key={trip.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">{trip.title}</p>
                  <p className="text-xs text-neutral-500">{trip.destination}</p>
                </td>
                <td className="px-4 py-3 text-neutral-700">{trip.user.name ?? trip.user.email}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {formatDateID(trip.startDate)} – {formatDateID(trip.endDate)}
                </td>
                <td className="px-4 py-3">
                  <TripStatusBadge status={trip.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination basePath="/admin/trips" params={{ q: query.q, status: query.status }} page={query.page} totalPages={totalPages} />
    </div>
  );
}