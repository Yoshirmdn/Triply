import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { applyPlan } from "@/lib/itinerary-service";
import { accessWhere, memberSelect } from "@/lib/trip-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { applyPlanSchema } from "@/lib/validations/generator.schema";

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
            title: true,
            members: memberSelect(actor.id),
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

    const body = await request.json().catch(() => null);
    const parsed = applyPlanSchema.safeParse(body);
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

    const created = await applyPlan(trip.id, parsed.data);

    await prisma.activityLog.create({
      data: {
        userId: actor.id,
        action: "ITINERARY_GENERATED",
        description: `Membuat itinerary otomatis (${created} tempat) untuk "${trip.title}"`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Data created successfully!",
        data: { created },
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
