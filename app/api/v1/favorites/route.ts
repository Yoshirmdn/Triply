import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PlacesApiError } from "@/lib/geoapify";
import { serializeSavedPlace, upsertPlace } from "@/lib/place-helpers";
import { favoriteInputSchema } from "@/lib/validations/place.schema";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const favorites = await prisma.favorite.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: "desc" },
      include: { place: true },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: favorites.map((favorite) => ({
        id: favorite.id,
        createdAt: favorite.createdAt.toISOString(),
        place: serializeSavedPlace(favorite.place),
      })),
      meta: { total: favorites.length },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, status: 500, message: "Internal server error!" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => null);
    const parsed = favoriteInputSchema.safeParse(body);
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

    const place = await upsertPlace(parsed.data.place);

    const favorite = await prisma.favorite.upsert({
      where: { userId_placeId: { userId: actor.id, placeId: place.id } },
      create: { userId: actor.id, placeId: place.id },
      update: {},
      include: { place: true },
    });

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Data created successfully!",
        data: {
          id: favorite.id,
          createdAt: favorite.createdAt.toISOString(),
          place: serializeSavedPlace(favorite.place),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof PlacesApiError) {
      const message = error.status === 404 ? "Data not found!" : error.message;
      return NextResponse.json(
        { success: false, status: error.status, message },
        { status: error.status },
      );
    }
    console.error(error);
    return NextResponse.json(
      { success: false, status: 500, message: "Internal server error!" },
      { status: 500 },
    );
  }
}
