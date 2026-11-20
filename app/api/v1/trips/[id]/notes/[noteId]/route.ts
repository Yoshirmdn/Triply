import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { memberSelect } from "@/lib/trip-helpers";
import { canEditTrip, serializeNote } from "@/lib/trip-extra-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { updateNoteSchema } from "@/lib/validations/trip-extra.schema";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; noteId: string }> };

async function loadTarget(actorId: string, id: string, noteId: string) {
  if (
    !uuidSchema.safeParse(id).success ||
    !uuidSchema.safeParse(noteId).success
  )
    return null;
  return prisma.tripNote.findFirst({
    where: {
      id: noteId,
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

    const { id, noteId } = await params;
    const target = await loadTarget(actor.id, id, noteId);
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

    const parsed = updateNoteSchema.safeParse(
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

    const data = parsed.data;
    const updated = await prisma.tripNote.update({
      where: { id: target.id },
      data: {
        kind: data.kind,
        title: data.title,
        content: data.content === undefined ? undefined : data.content || null,
        reference:
          data.reference === undefined ? undefined : data.reference || null,
        url: data.url === undefined ? undefined : data.url || null,
        dayNumber: data.dayNumber,
      },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data updated successfully!",
      data: serializeNote(updated),
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

    const { id, noteId } = await params;
    const target = await loadTarget(actor.id, id, noteId);
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

    await prisma.tripNote.delete({ where: { id: target.id } });

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
