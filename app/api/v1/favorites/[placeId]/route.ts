import { NextResponse } from "next/server";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { placeIdSchema } from "@/lib/validations/place.schema";
import { PLACE_PROVIDER } from "@/data/places";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ placeId: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
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

    const { placeId } = await params;
    if (!placeIdSchema.safeParse(placeId).success) {
      return NextResponse.json(
        { success: false, status: 404, message: "Data not found!" },
        { status: 404 },
      );
    }

    const result = await prisma.favorite.deleteMany({
      where: {
        userId: actor.id,
        place: { provider: PLACE_PROVIDER, providerPlaceId: placeId },
      },
    });
    if (result.count === 0) {
      return NextResponse.json(
        { success: false, status: 404, message: "Data not found!" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data deleted successfully!",
      data: null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, status: 500, message: "Internal server error!" },
      { status: 500 },
    );
  }
}
