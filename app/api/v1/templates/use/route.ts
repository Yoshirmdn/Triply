import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { applyPlan, buildPlan } from "@/lib/itinerary-service";
import { syncTripDays } from "@/lib/trip-helpers";
import { useTemplateSchema } from "@/lib/validations/generator.schema";
import { getTemplate } from "@/data/templates";
import { parseDateInput } from "@/utils/date";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

export async function POST(request: NextRequest) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }

    const parsed = useTemplateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: 400, message: "Validation failed!", errors: z.flattenError(parsed.error) },
        { status: 400 },
      );
    }

    const template = getTemplate(parsed.data.templateId);
    if (!template) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const start = parseDateInput(parsed.data.startDate);
    const end = new Date(start.getTime() + (template.days - 1) * DAY_MS);

    const trip = await prisma.$transaction(async (tx) => {
      const created = await tx.trip.create({
        data: {
          userId: actor.id,
          title: template.title,
          destination: template.destination,
          description: template.description,
          startDate: start,
          endDate: end,
          travelers: parsed.data.travelers,
          budget: template.dailyBudget * template.days * parsed.data.travelers,
          status: "PLANNING",
        },
        select: { id: true, title: true },
      });

      await syncTripDays(tx, created.id, start, end);
      await tx.activityLog.create({
        data: {
          userId: actor.id,
          action: "TRIP_CREATED",
          description: `Membuat perjalanan "${created.title}" dari template`,
        },
      });
      return created;
    });

    let generated = false;
    let created = 0;
    try {
      const plan = await buildPlan({
        latitude: template.latitude,
        longitude: template.longitude,
        radius: template.radius,
        days: template.days,
        style: template.style,
        pace: template.pace,
      });
      if (plan.used > 0) {
        created = await applyPlan(trip.id, {
          replace: true,
          days: plan.days.map((day) => ({
            dayNumber: day.dayNumber,
            items: day.items.map((item) => ({
              place: {
                placeId: item.place.placeId,
                name: item.place.name,
                address: item.place.address,
                latitude: item.place.latitude,
                longitude: item.place.longitude,
                category: item.place.category,
              },
              startTime: item.startTime,
              endTime: item.endTime,
              notes: item.notes,
            })),
          })),
        });
        generated = created > 0;
      }
    } catch (error) {
      console.error(error);
    }

    return NextResponse.json(
      {
        success: true,
        status: 201,
        message: "Data created successfully!",
        data: { tripId: trip.id, generated, created },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}