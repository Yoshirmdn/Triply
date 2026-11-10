import { NextRequest, NextResponse } from "next/server";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { uuidSchema } from "@/lib/validations/common.schema";
import {
  accessWhere,
  memberSelect,
  serializeDay,
  serializeTrip,
  syncTripDays,
  TripDayConflictError,
} from "@/lib/trip-helpers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
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

    const { id } = await params;
    const validId = uuidSchema.safeParse(id);
    const trip = validId.success
      ? await prisma.trip.findFirst({ where: { id, ...accessWhere(actor) }, select: { id: true } })
      : null;

    if (!trip) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    const days = await prisma.tripDay.findMany({
      where: { tripId: id },
      orderBy: { dayNumber: "asc" },
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: days.map(serializeDay),
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

export async function POST(_request: NextRequest, { params }: Ctx) {
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

    const { id } = await params;
    const validId = uuidSchema.safeParse(id);
    const trip = validId.success
      ? await prisma.trip.findFirst({
          where: { id, ...accessWhere(actor) },
          include: { members: memberSelect(actor.id) },
        })
      : null;

    if (!trip) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    if (!serializeTrip(trip, actor).canEdit) {
      return NextResponse.json(
        {
          success: false,
          status: 403,
          message: "Forbidden!",
        },
        { status: 403 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await syncTripDays(tx, id, trip.startDate, trip.endDate);
    });

    const days = await prisma.tripDay.findMany({
      where: { tripId: id },
      orderBy: { dayNumber: "asc" },
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Days synchronized successfully!",
      data: days.map(serializeDay),
    });
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