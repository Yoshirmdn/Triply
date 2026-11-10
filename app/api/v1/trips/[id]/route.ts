import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { tripUpdateSchema, validateTripDates } from "@/lib/validations/trip.schema";
import { uuidSchema } from "@/lib/validations/common.schema";
import {
  accessWhere,
  memberSelect,
  serializeDay,
  serializeTrip,
  syncTripDays,
  TripDayConflictError,
} from "@/lib/trip-helpers";
import { parseDateInput, toDateInput } from "@/utils/date";

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
      ? await prisma.trip.findFirst({
          where: { id, ...accessWhere(actor) },
          include: {
            members: memberSelect(actor.id),
            days: { orderBy: { dayNumber: "asc" }, include: { _count: { select: { items: true } } } },
          },
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

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: { ...serializeTrip(trip, actor), days: trip.days.map(serializeDay) },
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

export async function PATCH(request: NextRequest, { params }: Ctx) {
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
    const existing = validId.success
      ? await prisma.trip.findFirst({
          where: { id, ...accessWhere(actor) },
          include: { members: memberSelect(actor.id) },
        })
      : null;

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    if (!serializeTrip(existing, actor).canEdit) {
      return NextResponse.json(
        {
          success: false,
          status: 403,
          message: "Forbidden!",
        },
        { status: 403 },
      );
    }

    const body = tripUpdateSchema.safeParse(await request.json().catch(() => null));
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

    const patch = body.data;
    const startValue = patch.startDate ?? toDateInput(existing.startDate);
    const endValue = patch.endDate ?? toDateInput(existing.endDate);
    const dateError = validateTripDates(startValue, endValue);
    if (dateError) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: dateError,
        },
        { status: 400 },
      );
    }

    const start = parseDateInput(startValue);
    const end = parseDateInput(endValue);
    const datesChanged =
      start.getTime() !== existing.startDate.getTime() || end.getTime() !== existing.endDate.getTime();

    const trip = await prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id },
        data: {
          title: patch.title,
          destination: patch.destination,
          description: patch.description === undefined ? undefined : patch.description || null,
          startDate: patch.startDate ? start : undefined,
          endDate: patch.endDate ? end : undefined,
          travelers: patch.travelers,
          budget: patch.budget,
          coverImage: patch.coverImage === undefined ? undefined : patch.coverImage || null,
          status: patch.status,
        },
        include: { members: memberSelect(actor.id) },
      });

      if (datesChanged) await syncTripDays(tx, id, start, end);

      await tx.activityLog.create({
        data: {
          userId: actor.id,
          action: "TRIP_UPDATED",
          description: `Memperbarui perjalanan "${updated.title}"`,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data updated successfully!",
      data: serializeTrip(trip, actor),
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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            success: false,
            status: 404,
            message: "Data not found!",
          },
          { status: 404 },
        );
      }
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

export async function DELETE(_request: NextRequest, { params }: Ctx) {
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
    const existing = validId.success
      ? await prisma.trip.findFirst({
          where: { id, ...accessWhere(actor) },
          select: { title: true, userId: true },
        })
      : null;

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    if (existing.userId !== actor.id) {
      return NextResponse.json(
        {
          success: false,
          status: 403,
          message: "Forbidden!",
        },
        { status: 403 },
      );
    }

    await prisma.$transaction([
      prisma.trip.delete({ where: { id } }),
      prisma.activityLog.create({
        data: {
          userId: actor.id,
          action: "TRIP_DELETED",
          description: `Menghapus perjalanan "${existing.title}"`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data deleted successfully!",
      data: null,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            success: false,
            status: 404,
            message: "Data not found!",
          },
          { status: 404 },
        );
      }
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