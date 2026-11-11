import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PlacesApiError } from "@/lib/geoapify";
import { accessWhere, memberSelect } from "@/lib/trip-helpers";
import { serializeSavedPlace, upsertPlace } from "@/lib/place-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { addItineraryItemSchema } from "@/lib/validations/place.schema";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function serializeItem(item: {
  id: string;
  tripDayId: string;
  placeId: string | null;
  title: string | null;
  startTime: string | null;
  endTime: string | null;
  sortOrder: number;
  notes: string | null;
  place: Parameters<typeof serializeSavedPlace>[0] | null;
}) {
  return {
    id: item.id,
    tripDayId: item.tripDayId,
    placeId: item.placeId,
    title: item.title,
    startTime: item.startTime,
    endTime: item.endTime,
    sortOrder: item.sortOrder,
    notes: item.notes,
    place: item.place ? serializeSavedPlace(item.place) : null,
  };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json(
        { success: false, status: 403, message: "Account is inactive!" },
        { status: 403 },
      );
    }
    if (!actor) {
      return NextResponse.json(
        { success: false, status: 401, message: "Unauthorized!" },
        { status: 401 },
      );
    }

    const { id } = await params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json(
        { success: false, status: 404, message: "Data not found!" },
        { status: 404 },
      );
    }

    const trip = await prisma.trip.findFirst({
      where: { id, ...accessWhere(actor) },
      select: { id: true },
    });
    if (!trip) {
      return NextResponse.json(
        { success: false, status: 404, message: "Data not found!" },
        { status: 404 },
      );
    }

    const items = await prisma.itineraryItem.findMany({
      where: { tripDay: { tripId: id } },
      orderBy: [{ tripDay: { dayNumber: "asc" } }, { sortOrder: "asc" }],
      include: { place: true },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: items.map(serializeItem),
      meta: { total: items.length },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, status: 500, message: "Internal server error!" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json(
        { success: false, status: 403, message: "Account is inactive!" },
        { status: 403 },
      );
    }
    if (!actor) {
      return NextResponse.json(
        { success: false, status: 401, message: "Unauthorized!" },
        { status: 401 },
      );
    }

    const { id } = await params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json(
        { success: false, status: 404, message: "Data not found!" },
        { status: 404 },
      );
    }

    const trip = await prisma.trip.findFirst({
      where: { id, ...accessWhere(actor) },
      select: { id: true, userId: true, members: memberSelect(actor.id) },
    });
    if (!trip) {
      return NextResponse.json(
        { success: false, status: 404, message: "Data not found!" },
        { status: 404 },
      );
    }

    const memberRole = trip.members[0]?.role;
    const canEdit =
      trip.userId === actor.id ||
      (memberRole !== undefined && memberRole !== "VIEWER");
    if (!canEdit) {
      return NextResponse.json(
        { success: false, status: 403, message: "Forbidden!" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = addItineraryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Validation failed!",
          errors: z.flattenError(parsed.error),
        },
        { status: 400 },
      );
    }

    const day = await prisma.tripDay.findFirst({
      where: { id: parsed.data.tripDayId, tripId: id },
      select: { id: true, dayNumber: true },
    });
    if (!day) {
      return NextResponse.json(
        { success: false, status: 404, message: "Data not found!" },
        { status: 404 },
      );
    }

    const place = await upsertPlace(parsed.data.place);

    const last = await prisma.itineraryItem.aggregate({
      where: { tripDayId: day.id },
      _max: { sortOrder: true },
    });

    const item = await prisma.itineraryItem.create({
      data: {
        tripDayId: day.id,
        placeId: place.id,
        startTime: parsed.data.startTime ?? null,
        endTime: parsed.data.endTime ?? null,
        notes: parsed.data.notes ?? null,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
      include: { place: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: actor.id,
        action: "ITINERARY_ITEM_ADDED",
        description: `Menambahkan "${place.name}" ke hari ${day.dayNumber}`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Data created successfully!",
        data: serializeItem(item),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof PlacesApiError) {
      const message = error.status === 404 ? "Data not found!" : error.message;
      return NextResponse.json(
        { success: false, status: error.status, message },
        { status: error.status },
      );
    }
    console.error(error);
    return NextResponse.json(
      { success: false, status: 500, message: "Internal server error!" },
      { status: 500 },
    );
  }
}
