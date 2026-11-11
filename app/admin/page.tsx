import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/fragment/stat-card";
import { formatDateTimeID, todayUTC } from "@/utils/date";

export const metadata = { title: "Ringkasan Admin" };

export default async function AdminPage() {
  await requirePageRole("SUPER_ADMIN");
  const today = todayUTC();

  const [
    totalUsers,
    activeUsers,
    totalTrips,
    upcomingTrips,
    recentUsers,
    activities,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.trip.count(),
    prisma.trip.count({
      where: {
        startDate: { gte: today },
        status: { in: ["PLANNING", "UPCOMING"] },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const data = {
    totalUsers,
    activeUsers,
    totalTrips,
    upcomingTrips,
    recentUsers,
    recentActivities: activities.map((activity) => ({
      id: activity.id,
      description: activity.description,
      createdAt: activity.createdAt,
      userLabel: activity.user
        ? (activity.user.name ?? activity.user.email)
        : null,
    })),
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Ringkasan
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total pengguna" value={data.totalUsers} />
        <StatCard label="Pengguna aktif" value={data.activeUsers} />
        <StatCard label="Total perjalanan" value={data.totalTrips} />
        <StatCard label="Perjalanan akan datang" value={data.upcomingTrips} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">
            Pengguna terbaru
          </h2>
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {data.recentUsers.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900">
                    {user.name ?? user.email}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {user.email}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-neutral-700">
                    {user.role}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {formatDateTimeID(user.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">
            Aktivitas terbaru
          </h2>
          {data.recentActivities.length === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500">
              Belum ada aktivitas.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
              {data.recentActivities.map((activity) => (
                <li key={activity.id} className="px-5 py-3 text-sm">
                  <p className="text-neutral-900">{activity.description}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {activity.userLabel ?? "Sistem"} ·{" "}
                    {formatDateTimeID(activity.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
