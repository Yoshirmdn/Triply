import { NextRequest, NextResponse } from "next/server";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PlacesApiError, getPlaceDetail } from "@/lib/geoapify";
import { placeIdSchema } from "@/lib/validations/place.schema";
import { BASIC_AUTH_CHALLENGE, validateBasicAuth } from "@/utils/auth";
import { PLACE_PROVIDER } from "@/data/places";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ placeId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json(
        { success: false, status: 403, message: "Account is inactive!" },
        { status: 403 },
      );
    }
    if (!actor && !validateBasicAuth(request)) {
      return NextResponse.json(
        { success: false, status: 401, message: "Unauthorized!" },
        { status: 401, headers: { "WWW-Authenticate": BASIC_AUTH_CHALLENGE } },
      );
    }

    const { placeId } = await params;
    if (!placeIdSchema.safeParse(placeId).success) {
      return NextResponse.json(
        { success: false, status: 404, message: "Data not found!" },
        { status: 404 },
      );
    }

    const place = await getPlaceDetail(placeId);

    let isFavorite = false;
    if (actor) {
      const favorite = await prisma.favorite.findFirst({
        where: {
          userId: actor.id,
          place: { provider: PLACE_PROVIDER, providerPlaceId: placeId },
        },
        select: { id: true },
      });
      isFavorite = favorite !== null;
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: { ...place, isFavorite },
    });
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
