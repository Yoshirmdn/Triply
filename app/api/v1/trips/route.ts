import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { listTripsQuerySchema, tripInputSchema } from "@/lib/validations/trip.schema";
import { accessWhere, memberSelect, serializeTrip, syncTripDays, TripDayConflictError } from "@/lib/trip-helpers";
import { parseDateInput } from "@/utils/date";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

    const query = listTripsQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!query.success) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Validation failed",
          errors: z.flattenError(query.error),
        },
        { status: 400 },
      );
    }

    const { page, pageSize, status } = query.data;
    const where = { ...accessWhere(actor), ...(status ? { status } : {}) };

    const [items, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        orderBy: { startDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { members: memberSelect(actor.id) },
      }),
      prisma.trip.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: items.map((trip) => serializeTrip(trip, actor)),
      meta: { page, pageSize, total },
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

export async function POST(request: NextRequest) {
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

    const body = tripInputSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Validation failed",
          errors: z.flattenError(body.error),
        },
        { status: 400 },
      );
    }

    const input = body.data;
    const start = parseDateInput(input.startDate);
    const end = parseDateInput(input.endDate);

    const trip = await prisma.$transaction(async (tx) => {
      const createdTrip = await tx.trip.create({
        data: {
          userId: actor.id,
          title: input.title,
          destination: input.destination,
          description: input.description || null,
          startDate: start,
          endDate: end,
          travelers: input.travelers,
          budget: input.budget,
          coverImage: input.coverImage || null,
          status: input.status,
        },
        include: { members: memberSelect(actor.id) },
      });

      await syncTripDays(tx, createdTrip.id, start, end);
      await tx.activityLog.create({
        data: {
          userId: actor.id,
          action: "TRIP_CREATED",
          description: `Membuat perjalanan "${createdTrip.title}"`,
        },
      });

      return createdTrip;
    });

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Data created successfully!",
        data: serializeTrip(trip, actor),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof TripDayConflictError) {
      return NextResponse.json(
        {
          success: false,
          status: 409,
          message: error.message,
        },
        { status: 409 },
      );
    }

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