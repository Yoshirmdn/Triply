import Link from "next/link";
import { requirePageUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { attachStats } from "@/lib/place-stats";
import { PlaceCard } from "@/components/fragment/place-card";

export const metadata = { title: "Favorit" };

export default async function FavoritesPage() {
  const actor = await requirePageUser();
  const favorites = await prisma.favorite.findMany({
    where: { userId: actor.id },
    orderBy: { createdAt: "desc" },
    include: { place: true },
  });
  const places = await attachStats(
    favorites.map((favorite) => ({
      placeId: favorite.place.providerPlaceId,
      name: favorite.place.name,
      address: favorite.place.address,
      latitude: favorite.place.latitude,
      longitude: favorite.place.longitude,
      category: favorite.place.category,
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Favorit</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Tempat yang kamu simpan untuk perjalanan berikutnya.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="text-sm text-neutral-600">Belum ada tempat favorit.</p>
          <Link
            href="/dashboard/explore"
            className="mt-3 inline-block text-sm font-medium text-teal-800 hover:underline"
          >
            Jelajahi tempat
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <PlaceCard
              key={place.placeId}
              place={{ ...place, isFavorite: true }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
