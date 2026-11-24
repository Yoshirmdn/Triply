import { NextRequest, NextResponse } from "next/server";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { accessWhere, memberSelect } from "@/lib/trip-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; settlementId: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }

    const { id, settlementId } = await params;
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(settlementId).success) {
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

    const result = await prisma.tripSettlement.deleteMany({ where: { id: settlementId, tripId: trip.id } });
    if (result.count === 0) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: 200, message: "Data deleted successfully!", data: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}