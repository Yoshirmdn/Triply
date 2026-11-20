import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { accessWhere, memberSelect } from "@/lib/trip-helpers";
import { canEditTrip, serializeChecklistItem } from "@/lib/trip-extra-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { createChecklistSchema } from "@/lib/validations/trip-extra.schema";
import { CHECKLIST_PRESETS, MAX_CHECKLIST_ITEMS } from "@/data/trip-extra";

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

    const items = await prisma.tripChecklistItem.findMany({
      where: { tripId: trip.id },
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: items.map(serializeChecklistItem),
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

    const parsed = createChecklistSchema.safeParse(
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

    const existing = await prisma.tripChecklistItem.findMany({
      where: { tripId: trip.id },
      select: { kind: true, text: true, sortOrder: true },
    });

    const wanted = parsed.data.preset
      ? CHECKLIST_PRESETS[parsed.data.kind]
      : [parsed.data.text as string];
    const taken = new Set(
      existing
        .filter((item) => item.kind === parsed.data.kind)
        .map((item) => item.text.toLowerCase()),
    );
    const fresh = wanted.filter((text) => !taken.has(text.toLowerCase()));

    if (existing.length + fresh.length > MAX_CHECKLIST_ITEMS) {
      return NextResponse.json(
        { success: false, status: 422, message: "Checklist limit reached!" },
        { status: 422 },
      );
    }

    const start =
      existing.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
    if (fresh.length > 0) {
      await prisma.tripChecklistItem.createMany({
        data: fresh.map((text, index) => ({
          tripId: trip.id,
          kind: parsed.data.kind,
          text,
          sortOrder: start + index,
          createdById: actor.id,
        })),
      });
    }

    const items = await prisma.tripChecklistItem.findMany({
      where: { tripId: trip.id },
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Data created successfully!",
        data: items.map(serializeChecklistItem),
        meta: { total: items.length, added: fresh.length },
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
