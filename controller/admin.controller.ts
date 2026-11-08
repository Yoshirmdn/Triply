import "server-only";
import { prisma } from "@/lib/prisma";
import type { AdminOverview } from "@/@type/trip";
import { todayUTC } from "@/utils/date";

export async function getAdminOverview(): Promise<AdminOverview> {
  const today = todayUTC();

  const [totalUsers, activeUsers, totalTrips, upcomingTrips, recentUsers, activities] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.trip.count(),
    prisma.trip.count({
      where: { startDate: { gte: today }, status: { in: ["PLANNING", "UPCOMING"] } },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    totalTrips,
    upcomingTrips,
    recentUsers,
    recentActivities: activities.map((activity) => ({
      id: activity.id,
      action: activity.action,
      description: activity.description,
      createdAt: activity.createdAt,
      userLabel: activity.user ? (activity.user.name ?? activity.user.email) : null,
    })),
  };
}