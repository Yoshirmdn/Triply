import Link from "next/link";
import { requirePageUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { loadTripOrNotFound } from "@/lib/page-helpers";
import { serializeChecklistItem } from "@/lib/trip-extra-helpers";
import { ChecklistClient } from "@/components/fragment/checklist-client";

type ChecklistPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ChecklistPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);
  return { title: `Checklist · ${trip.title}` };
}

export default async function ChecklistPage({ params }: ChecklistPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);

  const items = await prisma.tripChecklistItem.findMany({
    where: { tripId: trip.id },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/dashboard/trips/${trip.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← {trip.title}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Checklist
        </h1>
        <p className="text-sm text-neutral-600">
          {trip.canEdit
            ? "Catat barang bawaan dan persiapan. Semua anggota perjalanan melihat daftar yang sama."
            : "Kamu hanya bisa melihat checklist ini."}
        </p>
      </div>

      <ChecklistClient
        tripId={trip.id}
        initialItems={items.map(serializeChecklistItem)}
        canEdit={trip.canEdit}
      />
    </div>
  );
}
