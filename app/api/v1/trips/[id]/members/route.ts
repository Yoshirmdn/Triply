import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { accessWhere } from "@/lib/trip-helpers";
import { listTripPeople } from "@/lib/member-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { inviteMemberSchema } from "@/lib/validations/member.schema";
import { MAX_TRIP_PEOPLE } from "@/data/member";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
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

    const { id } = await params;
    const trip = uuidSchema.safeParse(id).success
      ? await prisma.trip.findFirst({
          where: { id, ...accessWhere(actor) },
          select: { id: true, userId: true },
        })
      : null;

    if (!trip) {
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
    const all = await listTripPeople(trip.id);
    const people = isOwner
      ? all
      : all.filter((person) => person.kind !== "invite");

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: { people, isOwner },
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

export async function POST(request: NextRequest, { params }: Ctx) {
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

    const { id } = await params;
    const trip = uuidSchema.safeParse(id).success
      ? await prisma.trip.findFirst({
          where: { id, userId: actor.id },
          select: {
            id: true,
            title: true,
            _count: { select: { members: true, invites: true } },
          },
        })
      : null;

    if (!trip) {
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
    const parsed = inviteMemberSchema.safeParse(body);
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

    const { email, role } = parsed.data;

    if (email === actor.email.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          status: 422,
          message: "You cannot invite yourself!",
        },
        { status: 422 },
      );
    }

    if (trip._count.members + trip._count.invites + 1 >= MAX_TRIP_PEOPLE) {
      return NextResponse.json(
        {
          success: false,
          status: 422,
          message: "Member limit reached!",
        },
        { status: 422 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      const alreadyMember = await prisma.tripMember.findUnique({
        where: { tripId_userId: { tripId: trip.id, userId: existingUser.id } },
        select: { id: true },
      });
      if (alreadyMember) {
        return NextResponse.json(
          {
            success: false,
            status: 409,
            message: "Already a member!",
          },
          { status: 409 },
        );
      }

      await prisma.tripMember.create({
        data: { tripId: trip.id, userId: existingUser.id, role },
      });
      await prisma.tripInvite.deleteMany({ where: { tripId: trip.id, email } });
    } else {
      await prisma.tripInvite.upsert({
        where: { tripId_email: { tripId: trip.id, email } },
        update: { role, invitedBy: actor.id },
        create: { tripId: trip.id, email, role, invitedBy: actor.id },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: actor.id,
        action: "TRIP_MEMBER_INVITED",
        description: `Mengundang ${email} ke perjalanan: ${trip.title}`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Member invited successfully!",
        data: { status: existingUser ? "member" : "invite" },
      },
      { status: 201 },
    );
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
