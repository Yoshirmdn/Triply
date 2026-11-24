import Link from "next/link";
import { requirePageUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { loadTripOrNotFound } from "@/lib/page-helpers";
import { loadAccount } from "@/lib/account-helpers";
import { serializeItineraryItem } from "@/lib/place-helpers";
import { PlannerClient } from "@/components/fragment/planner-client";
import { AutoPlanDialog } from "@/components/fragment/auto-plan-dialog";

type PlannerPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PlannerPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);
  return { title: `Planner · ${trip.title}` };
}

export default async function PlannerPage({ params }: PlannerPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);

  const [items, account] = await Promise.all([
    prisma.itineraryItem.findMany({
      where: { tripDay: { tripId: trip.id } },
      orderBy: [{ tripDay: { dayNumber: "asc" } }, { sortOrder: "asc" }],
      include: { place: true },
    }),
    loadAccount(actor.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href={`/dashboard/trips/${trip.id}`} className="text-sm text-neutral-500 hover:text-neutral-900">
          ← {trip.title}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Planner itinerary</h1>
            <p className="text-sm text-neutral-600">
              {trip.canEdit
                ? "Seret tempat untuk mengurutkan atau memindahkannya antar hari."
                : "Kamu hanya bisa melihat itinerary ini."}
            </p>
          </div>
          {trip.canEdit ? (
            <AutoPlanDialog
              tripId={trip.id}
              hasItems={items.length > 0}
              defaultStyle={account?.defaultStyle}
              defaultPace={account?.defaultPace}
            />
          ) : null}
        </div>
      </div>

      <PlannerClient
        key={items.map((item) => item.id).join(",")}
        tripId={trip.id}
        days={trip.days}
        initialItems={items.map(serializeItineraryItem)}
        canEdit={trip.canEdit}
      />
    </div>
  );
}