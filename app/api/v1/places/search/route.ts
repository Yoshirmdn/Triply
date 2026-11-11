import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PlacesApiError, geocodeFirst, searchPlaces } from "@/lib/geoapify";
import { searchPlacesQuerySchema } from "@/lib/validations/place.schema";
import { BASIC_AUTH_CHALLENGE, validateBasicAuth } from "@/utils/auth";
import { PLACE_PROVIDER } from "@/data/places";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

    const parsed = searchPlacesQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
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

    let latitude = parsed.data.lat;
    let longitude = parsed.data.lng;
    if (latitude === undefined || longitude === undefined) {
      const center = await geocodeFirst(parsed.data.q as string);
      if (!center) {
        return NextResponse.json(
          { success: false, status: 404, message: "Data not found!" },
          { status: 404 },
        );
      }
      latitude = center.latitude;
      longitude = center.longitude;
    }

    const places = await searchPlaces({
      lat: latitude,
      lng: longitude,
      radius: parsed.data.radius,
      limit: parsed.data.limit,
      category: parsed.data.category,
      name: parsed.data.name,
    });

    let favoriteIds = new Set<string>();
    if (actor && places.length > 0) {
      const favorites = await prisma.favorite.findMany({
        where: {
          userId: actor.id,
          place: {
            provider: PLACE_PROVIDER,
            providerPlaceId: { in: places.map((place) => place.placeId) },
          },
        },
        select: { place: { select: { providerPlaceId: true } } },
      });
      favoriteIds = new Set(
        favorites.map((favorite) => favorite.place.providerPlaceId),
      );
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: places.map((place) => ({
        ...place,
        isFavorite: favoriteIds.has(place.placeId),
      })),
      meta: { total: places.length },
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
