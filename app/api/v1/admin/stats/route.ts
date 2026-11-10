import { NextResponse } from "next/server";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { todayUTC } from "@/utils/date";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json(
        {
          success: false,
          status: 403,
          message: "Account is inactive!",
        },
        { status: 403 },
      );
    }
    if (!actor) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Unauthorized!",
        },
        { status: 401 },
      );
    }
    if (actor.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          status: 403,
          message: "Forbidden!",
        },
        { status: 403 },
      );
    }

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

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: {
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
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: "Internal server error!",
      },
      { status: 500 },
    );
  }
}