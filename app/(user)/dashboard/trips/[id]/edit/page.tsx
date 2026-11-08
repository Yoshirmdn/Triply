import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/permissions";
import { loadTripOrNotFound } from "@/lib/page-helpers";
import { TripForm } from "@/components/fragment/trip-form";

export const metadata = { title: "Edit Perjalanan" };

type EditTripPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTripPage({ params }: EditTripPageProps) {
  const actor = await requirePageUser();
  const { id } = await params;
  const trip = await loadTripOrNotFound(actor, id);
  if (!trip.canEdit) redirect(`/dashboard/trips/${trip.id}`);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Edit perjalanan</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Mengubah tanggal akan menyesuaikan hari perjalanan. Hari yang sudah berisi itinerary tidak akan dihapus otomatis.
        </p>
      </div>
      <TripForm trip={trip} />
    </div>
  );
}