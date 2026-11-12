import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { accessWhere, memberSelect } from "@/lib/trip-helpers";
import { serializeItineraryItem } from "@/lib/place-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { updateItineraryItemSchema } from "@/lib/validations/place.schema";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }

    const { id, itemId } = await params;
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(itemId).success) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const trip = await prisma.trip.findFirst({
      where: { id, ...accessWhere(actor) },
      select: { id: true, userId: true, members: memberSelect(actor.id) },
    });
    if (!trip) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const memberRole = trip.members[0]?.role;
    const canEdit = trip.userId === actor.id || (memberRole !== undefined && memberRole !== "VIEWER");
    if (!canEdit) {
      return NextResponse.json({ success: false, status: 403, message: "Forbidden!" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateItineraryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: 400, message: "Validation failed!", errors: z.flattenError(parsed.error) },
        { status: 400 },
      );
    }

    const existing = await prisma.itineraryItem.findFirst({
      where: { id: itemId, tripDay: { tripId: id } },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const item = await prisma.itineraryItem.update({
      where: { id: itemId },
      data: {
        ...(parsed.data.startTime !== undefined ? { startTime: parsed.data.startTime } : {}),
        ...(parsed.data.endTime !== undefined ? { endTime: parsed.data.endTime } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      },
      include: { place: true },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data updated successfully!",
      data: serializeItineraryItem(item),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }

    const { id, itemId } = await params;
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(itemId).success) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const trip = await prisma.trip.findFirst({
      where: { id, ...accessWhere(actor) },
      select: { id: true, userId: true, members: memberSelect(actor.id) },
    });
    if (!trip) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const memberRole = trip.members[0]?.role;
    const canEdit = trip.userId === actor.id || (memberRole !== undefined && memberRole !== "VIEWER");
    if (!canEdit) {
      return NextResponse.json({ success: false, status: 403, message: "Forbidden!" }, { status: 403 });
    }

    const result = await prisma.itineraryItem.deleteMany({
      where: { id: itemId, tripDay: { tripId: id } },
    });
    if (result.count === 0) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: 200, message: "Data deleted successfully!", data: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}