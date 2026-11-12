import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PlacesApiError, getRoute } from "@/lib/geoapify";
import { accessWhere } from "@/lib/trip-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { routeQuerySchema } from "@/lib/validations/place.schema";
import { MAX_ROUTE_STOPS } from "@/data/itinerary";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }

    const { id } = await params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const parsed = routeQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: 400, message: "Validation failed!", errors: z.flattenError(parsed.error) },
        { status: 400 },
      );
    }

    const trip = await prisma.trip.findFirst({ where: { id, ...accessWhere(actor) }, select: { id: true } });
    if (!trip) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const day = await prisma.tripDay.findFirst({ where: { id: parsed.data.dayId, tripId: id }, select: { id: true } });
    if (!day) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const items = await prisma.itineraryItem.findMany({
      where: { tripDayId: day.id, placeId: { not: null } },
      orderBy: { sortOrder: "asc" },
      include: { place: { select: { latitude: true, longitude: true } } },
    });

    const points = items.flatMap((item) =>
      item.place ? [{ latitude: item.place.latitude, longitude: item.place.longitude }] : [],
    );
    if (points.length < 2) {
      return NextResponse.json({ success: false, status: 400, message: "At least 2 places are required!" }, { status: 400 });
    }
    if (points.length > MAX_ROUTE_STOPS) {
      return NextResponse.json({ success: false, status: 400, message: "Too many stops!" }, { status: 400 });
    }

    const route = await getRoute(points, parsed.data.mode);

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: route,
    });
  } catch (error) {
    if (error instanceof PlacesApiError) {
      const message = error.status === 422 ? "Route not available!" : error.message;
      return NextResponse.json({ success: false, status: error.status, message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}