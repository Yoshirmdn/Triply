import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { accessWhere, memberSelect } from "@/lib/trip-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { reorderItinerarySchema } from "@/lib/validations/place.schema";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }

    const { id } = await params;
    if (!uuidSchema.safeParse(id).success) {
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
    const parsed = reorderItinerarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: 400, message: "Validation failed!", errors: z.flattenError(parsed.error) },
        { status: 400 },
      );
    }

    const dayIds = parsed.data.days.map((day) => day.tripDayId);
    const itemIds = parsed.data.days.flatMap((day) => day.itemIds);
    if (new Set(dayIds).size !== dayIds.length || new Set(itemIds).size !== itemIds.length) {
      return NextResponse.json({ success: false, status: 400, message: "Validation failed!" }, { status: 400 });
    }

    const [dayCount, itemCount] = await Promise.all([
      prisma.tripDay.count({ where: { id: { in: dayIds }, tripId: id } }),
      prisma.itineraryItem.count({ where: { id: { in: itemIds }, tripDay: { tripId: id } } }),
    ]);
    if (dayCount !== dayIds.length || itemCount !== itemIds.length) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    await prisma.$transaction(
      parsed.data.days.flatMap((day) =>
        day.itemIds.map((itemId, index) =>
          prisma.itineraryItem.update({
            where: { id: itemId },
            data: { tripDayId: day.tripDayId, sortOrder: index },
          }),
        ),
      ),
    );

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data updated successfully!",
      data: { updated: itemIds.length },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}