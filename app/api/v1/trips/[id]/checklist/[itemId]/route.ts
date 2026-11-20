import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { memberSelect } from "@/lib/trip-helpers";
import { canEditTrip, serializeChecklistItem } from "@/lib/trip-extra-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { updateChecklistSchema } from "@/lib/validations/trip-extra.schema";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; itemId: string }> };

async function loadTarget(actorId: string, id: string, itemId: string) {
  if (
    !uuidSchema.safeParse(id).success ||
    !uuidSchema.safeParse(itemId).success
  )
    return null;
  return prisma.tripChecklistItem.findFirst({
    where: {
      id: itemId,
      tripId: id,
      trip: {
        OR: [{ userId: actorId }, { members: { some: { userId: actorId } } }],
      },
    },
    include: {
      trip: { select: { userId: true, members: memberSelect(actorId) } },
    },
  });
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
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

    const { id, itemId } = await params;
    const target = await loadTarget(actor.id, id, itemId);
    if (!target) {
      return NextResponse.json(
        { success: false, status: 404, message: "Data not found!" },
        { status: 404 },
      );
    }
    if (!canEditTrip(target.trip, actor)) {
      return NextResponse.json(
        { success: false, status: 403, message: "Forbidden!" },
        { status: 403 },
      );
    }

    const parsed = updateChecklistSchema.safeParse(
      await request.json().catch(() => null),
    );
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

    const updated = await prisma.tripChecklistItem.update({
      where: { id: target.id },
      data: parsed.data,
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data updated successfully!",
      data: serializeChecklistItem(updated),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, status: 500, message: "Internal server error!" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
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

    const { id, itemId } = await params;
    const target = await loadTarget(actor.id, id, itemId);
    if (!target) {
      return NextResponse.json(
        { success: false, status: 404, message: "Data not found!" },
        { status: 404 },
      );
    }
    if (!canEditTrip(target.trip, actor)) {
      return NextResponse.json(
        { success: false, status: 403, message: "Forbidden!" },
        { status: 403 },
      );
    }

    await prisma.tripChecklistItem.delete({ where: { id: target.id } });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data deleted successfully!",
      data: null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, status: 500, message: "Internal server error!" },
      { status: 500 },
    );
  }
}
