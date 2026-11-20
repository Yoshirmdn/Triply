import Link from "next/link";
import { requirePageUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { loadTripOrNotFound } from "@/lib/page-helpers";
import { serializeNote } from "@/lib/trip-extra-helpers";
import { NotesClient } from "@/components/fragment/notes-client";

type NotesPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: NotesPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);
  return { title: `Catatan · ${trip.title}` };
}

export default async function NotesPage({ params }: NotesPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);

  const notes = await prisma.tripNote.findMany({
    where: { tripId: trip.id },
    orderBy: [{ kind: "desc" }, { dayNumber: "asc" }, { createdAt: "desc" }],
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
          Catatan, booking & tiket
        </h1>
        <p className="text-sm text-neutral-600">
          Simpan kode booking, tautan tiket, alamat penginapan, dan catatan
          penting dalam satu tempat.
        </p>
      </div>

      <NotesClient
        tripId={trip.id}
        dayCount={trip.days.length}
        initialNotes={notes.map(serializeNote)}
        canEdit={trip.canEdit}
      />
    </div>
  );
}
