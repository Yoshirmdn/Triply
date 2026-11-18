import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { geocodeFirst } from "@/lib/catalog";
import { buildPlan } from "@/lib/itinerary-service";
import { accessWhere, memberSelect } from "@/lib/trip-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { generateRequestSchema } from "@/lib/validations/generator.schema";
import { MAX_GENERATE_DAYS } from "@/data/generator";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

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
          select: {
            id: true,
            userId: true,
            destination: true,
            members: memberSelect(actor.id),
            _count: { select: { days: true } },
          },
        })
      : null;

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

    const body = await request.json().catch(() => ({}));
    const parsed = generateRequestSchema.safeParse(body ?? {});
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

    if (trip._count.days > MAX_GENERATE_DAYS) {
      return NextResponse.json(
        {
          success: false,
          status: 422,
          message: `Auto itinerary supports up to ${MAX_GENERATE_DAYS} days!`,
        },
        { status: 422 },
      );
    }

    const center = await geocodeFirst(trip.destination);
    if (!center) {
      return NextResponse.json(
        {
          success: false,
          status: 422,
          message: "Destination is not in the places catalog yet!",
        },
        { status: 422 },
      );
    }

    const plan = await buildPlan({
      latitude: center.latitude,
      longitude: center.longitude,
      radius: parsed.data.radius,
      days: trip._count.days,
      style: parsed.data.style,
      pace: parsed.data.pace,
    });

    if (plan.used === 0) {
      return NextResponse.json(
        { success: false, status: 422, message: "No places found nearby!" },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: plan,
    });
  } catch (error) {
    
    console.error(error);
    return NextResponse.json(
      { success: false, status: 500, message: "Internal server error!" },
      { status: 500 },
    );
  }
}
