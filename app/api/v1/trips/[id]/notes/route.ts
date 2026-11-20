import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { accessWhere, memberSelect } from "@/lib/trip-helpers";
import { canEditTrip, serializeNote } from "@/lib/trip-extra-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { createNoteSchema } from "@/lib/validations/trip-extra.schema";
import { MAX_TRIP_NOTES } from "@/data/trip-extra";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
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
    const trip = uuidSchema.safeParse(id).success
      ? await prisma.trip.findFirst({
          where: { id, ...accessWhere(actor) },
          select: { id: true },
        })
      : null;
    if (!trip) {
      return NextResponse.json(
        { success: false, status: 404, message: "Data not found!" },
        { status: 404 },
      );
    }

    const notes = await prisma.tripNote.findMany({
      where: { tripId: trip.id },
      orderBy: [{ kind: "desc" }, { dayNumber: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: notes.map(serializeNote),
      meta: { total: notes.length },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, status: 500, message: "Internal server error!" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
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
    const trip = uuidSchema.safeParse(id).success
      ? await prisma.trip.findFirst({
          where: { id, ...accessWhere(actor) },
          select: { id: true, userId: true, members: memberSelect(actor.id) },
        })
      : null;
    if (!trip) {
      return NextResponse.json(
        { success: false, status: 404, message: "Data not found!" },
        { status: 404 },
      );
    }
    if (!canEditTrip(trip, actor)) {
      return NextResponse.json(
        { success: false, status: 403, message: "Forbidden!" },
        { status: 403 },
      );
    }

    const parsed = createNoteSchema.safeParse(
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

    const total = await prisma.tripNote.count({ where: { tripId: trip.id } });
    if (total >= MAX_TRIP_NOTES) {
      return NextResponse.json(
        { success: false, status: 422, message: "Notes limit reached!" },
        { status: 422 },
      );
    }

    const note = await prisma.tripNote.create({
      data: {
        tripId: trip.id,
        kind: parsed.data.kind,
        title: parsed.data.title,
        content: parsed.data.content || null,
        reference: parsed.data.reference || null,
        url: parsed.data.url || null,
        dayNumber: parsed.data.dayNumber ?? null,
        createdById: actor.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Data created successfully!",
        data: serializeNote(note),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, status: 500, message: "Internal server error!" },
      { status: 500 },
    );
  }
}
