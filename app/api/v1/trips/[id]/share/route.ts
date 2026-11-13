import { NextRequest, NextResponse } from "next/server";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { uuidSchema } from "@/lib/validations/common.schema";
import { generateShareToken, sharePath } from "@/lib/share-token";

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
          where: { id, userId: actor.id },
          select: { isPublic: true, shareToken: true },
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

    const active = trip.isPublic && trip.shareToken !== null;

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: {
        isPublic: active,
        token: active ? trip.shareToken : null,
        path: active && trip.shareToken ? sharePath(trip.shareToken) : null,
      },
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

export async function POST(_request: NextRequest, { params }: Ctx) {
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
          select: { id: true, title: true, shareToken: true },
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

    const token = trip.shareToken ?? generateShareToken();
    await prisma.trip.update({
      where: { id: trip.id },
      data: { isPublic: true, shareToken: token },
    });
    await prisma.activityLog.create({
      data: {
        userId: actor.id,
        action: "TRIP_SHARED",
        description: `Membagikan perjalanan: ${trip.title}`,
      },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Share link enabled successfully!",
      data: { isPublic: true, token, path: sharePath(token) },
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

    const { id } = await params;
    const trip = uuidSchema.safeParse(id).success
      ? await prisma.trip.findFirst({
          where: { id, userId: actor.id },
          select: { id: true, title: true },
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

    await prisma.trip.update({
      where: { id: trip.id },
      data: { isPublic: false, shareToken: null },
    });
    await prisma.activityLog.create({
      data: {
        userId: actor.id,
        action: "TRIP_UNSHARED",
        description: `Menghentikan berbagi perjalanan: ${trip.title}`,
      },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Share link disabled successfully!",
      data: { isPublic: false, token: null, path: null },
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
