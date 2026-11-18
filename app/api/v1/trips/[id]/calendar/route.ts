import { NextRequest, NextResponse } from "next/server";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { accessWhere } from "@/lib/trip-helpers";
import { uuidSchema } from "@/lib/validations/common.schema";
import { buildIcs, slugify, type IcsItem } from "@/lib/ics";
import { toDateInput } from "@/utils/date";

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
          select: {
            title: true,
            days: {
              orderBy: { dayNumber: "asc" },
              select: {
                date: true,
                dayNumber: true,
                items: {
                  orderBy: { sortOrder: "asc" },
                  select: {
                    id: true,
                    title: true,
                    startTime: true,
                    endTime: true,
                    notes: true,
                    place: {
                      select: {
                        name: true,
                        address: true,
                        latitude: true,
                        longitude: true,
                      },
                    },
                  },
                },
              },
            },
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

    const items: IcsItem[] = trip.days.flatMap((day) =>
      day.items.map((item) => ({
        id: item.id,
        title: item.place?.name ?? item.title ?? "Kegiatan",
        date: toDateInput(day.date),
        startTime: item.startTime,
        endTime: item.endTime,
        address: item.place?.address ?? null,
        latitude: item.place?.latitude ?? null,
        longitude: item.place?.longitude ?? null,
        notes: item.notes,
        dayNumber: day.dayNumber,
      })),
    );

    const body = buildIcs({ tripTitle: trip.title, items });

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slugify(trip.title)}.ics"`,
        "Cache-Control": "no-store",
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
