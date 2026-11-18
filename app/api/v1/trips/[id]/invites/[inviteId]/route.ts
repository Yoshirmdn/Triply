import { NextRequest, NextResponse } from "next/server";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { uuidSchema } from "@/lib/validations/common.schema";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; inviteId: string }> };

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json(
        {
          success: false,
          status: 403,
          message: "Account is inactive!",
        },
        { status: 403 },
      );
    }
    if (!actor) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Unauthorized!",
        },
        { status: 401 },
      );
    }

    const { id, inviteId } = await params;
    const valid =
      uuidSchema.safeParse(id).success &&
      uuidSchema.safeParse(inviteId).success;
    const trip = valid
      ? await prisma.trip.findFirst({
          where: { id, userId: actor.id },
          select: { id: true },
        })
      : null;
    const invite = trip
      ? await prisma.tripInvite.findFirst({
          where: { id: inviteId, tripId: trip.id },
          select: { id: true },
        })
      : null;

    if (!trip || !invite) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    await prisma.tripInvite.delete({ where: { id: invite.id } });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Invite cancelled successfully!",
      data: null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: "Internal server error!",
      },
      { status: 500 },
    );
  }
}
