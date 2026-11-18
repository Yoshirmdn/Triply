import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { accessWhere } from "@/lib/trip-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { updateMemberSchema } from "@/lib/validations/member.schema";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; memberId: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
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

    const { id, memberId } = await params;
    const valid =
      uuidSchema.safeParse(id).success &&
      uuidSchema.safeParse(memberId).success;
    const trip = valid
      ? await prisma.trip.findFirst({
          where: { id, userId: actor.id },
          select: { id: true },
        })
      : null;
    const member = trip
      ? await prisma.tripMember.findFirst({
          where: { id: memberId, tripId: trip.id },
          select: { id: true },
        })
      : null;

    if (!trip || !member) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = updateMemberSchema.safeParse(body);
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

    await prisma.tripMember.update({
      where: { id: member.id },
      data: { role: parsed.data.role },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Member updated successfully!",
      data: { id: member.id, role: parsed.data.role },
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

    const { id, memberId } = await params;
    const valid =
      uuidSchema.safeParse(id).success &&
      uuidSchema.safeParse(memberId).success;
    const trip = valid
      ? await prisma.trip.findFirst({
          where: { id, ...accessWhere(actor) },
          select: { id: true, userId: true, title: true },
        })
      : null;
    const member = trip
      ? await prisma.tripMember.findFirst({
          where: { id: memberId, tripId: trip.id },
          select: { id: true, userId: true },
        })
      : null;

    if (!trip || !member) {
      return NextResponse.json(
        {
          success: false,
          status: 404,
          message: "Data not found!",
        },
        { status: 404 },
      );
    }

    const isOwner = trip.userId === actor.id;
    const isSelf = member.userId === actor.id;
    if (!isOwner && !isSelf) {
      return NextResponse.json(
        {
          success: false,
          status: 403,
          message: "Forbidden!",
        },
        { status: 403 },
      );
    }

    await prisma.tripMember.delete({ where: { id: member.id } });
    await prisma.activityLog.create({
      data: {
        userId: actor.id,
        action: isSelf ? "TRIP_MEMBER_LEFT" : "TRIP_MEMBER_REMOVED",
        description: isSelf
          ? `Keluar dari perjalanan: ${trip.title}`
          : `Mengeluarkan anggota dari perjalanan: ${trip.title}`,
      },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Member removed successfully!",
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
