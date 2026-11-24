import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { accessWhere, memberSelect } from "@/lib/trip-helpers";
import { getSettlementSummary, listParticipants } from "@/lib/settlement-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { createSettlementSchema } from "@/lib/validations/settlement.schema";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }

    const { id } = await params;
    const trip = uuidSchema.safeParse(id).success
      ? await prisma.trip.findFirst({ where: { id, ...accessWhere(actor) }, select: { id: true } })
      : null;
    if (!trip) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: await getSettlementSummary(trip.id),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }

    const { id } = await params;
    const trip = uuidSchema.safeParse(id).success
      ? await prisma.trip.findFirst({
          where: { id, ...accessWhere(actor) },
          select: { id: true, userId: true, members: memberSelect(actor.id) },
        })
      : null;
    if (!trip) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const memberRole = trip.members[0]?.role;
    const canEdit = trip.userId === actor.id || (memberRole !== undefined && memberRole !== "VIEWER");
    if (!canEdit) {
      return NextResponse.json({ success: false, status: 403, message: "Forbidden!" }, { status: 403 });
    }

    const parsed = createSettlementSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: 400, message: "Validation failed!", errors: z.flattenError(parsed.error) },
        { status: 400 },
      );
    }

    const participants = new Set((await listParticipants(trip.id)).map((person) => person.id));
    if (!participants.has(parsed.data.fromUserId) || !participants.has(parsed.data.toUserId)) {
      return NextResponse.json(
        { success: false, status: 422, message: "Pembayar dan penerima harus anggota perjalanan ini" },
        { status: 422 },
      );
    }

    await prisma.tripSettlement.create({
      data: {
        tripId: trip.id,
        fromUserId: parsed.data.fromUserId,
        toUserId: parsed.data.toUserId,
        amount: parsed.data.amount,
        createdById: actor.id,
      },
    });

    await prisma.activityLog.create({
      data: { userId: actor.id, action: "SETTLEMENT_CREATED", description: "Mencatat pelunasan patungan" },
    });

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Data created successfully!",
        data: await getSettlementSummary(trip.id),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}