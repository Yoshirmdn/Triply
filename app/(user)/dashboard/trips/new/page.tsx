import { requirePageUser } from "@/lib/permissions";
import { TripForm } from "@/components/fragment/trip-form";

export const metadata = { title: "Buat Perjalanan" };

export default async function NewTripPage() {
  await requirePageUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Buat perjalanan</h1>
        <p className="mt-1 text-sm text-neutral-500">Hari-hari perjalanan dibuat otomatis dari rentang tanggal.</p>
      </div>
      <TripForm />
    </div>
  );
}