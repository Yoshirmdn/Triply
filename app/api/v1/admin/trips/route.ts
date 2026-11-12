import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { listAdminTripsQuerySchema } from "@/lib/validations/admin.schema";
import { toDateInput } from "@/utils/date";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }
    if (actor.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, status: 403, message: "Forbidden!" }, { status: 403 });
    }

    const parsed = listAdminTripsQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: 400, message: "Validation failed!", errors: z.flattenError(parsed.error) },
        { status: 400 },
      );
    }

    const { q, status, page, pageSize } = parsed.data;
    const where = {
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { destination: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
    };

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.trip.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: trips.map((trip) => ({
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        status: trip.status,
        startDate: toDateInput(trip.startDate),
        endDate: toDateInput(trip.endDate),
        ownerLabel: trip.user.name ?? trip.user.email,
      })),
      meta: { page, pageSize, total },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}