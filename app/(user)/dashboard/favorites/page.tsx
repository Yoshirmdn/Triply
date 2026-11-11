import Link from "next/link";
import { MapPin } from "lucide-react";
import { requirePageUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { FavoriteButton } from "@/components/fragment/favorite-button";
import { AddToTripDialog } from "@/components/fragment/add-to-trip-dialog";
import { PLACE_CATEGORY_LABELS } from "@/data/places";

export const metadata = { title: "Favorit" };

export default async function FavoritesPage() {
  const actor = await requirePageUser();
  const favorites = await prisma.favorite.findMany({
    where: { userId: actor.id },
    orderBy: { createdAt: "desc" },
    include: { place: true },
  });

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => (
            <article
              key={favorite.id}
              className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <span className="inline-block rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-900">
                    {PLACE_CATEGORY_LABELS[favorite.place.category]}
                  </span>
                  <h3 className="line-clamp-2 font-semibold text-neutral-900">
                    {favorite.place.name}
                  </h3>
                </div>
                <FavoriteButton
                  place={{
                    placeId: favorite.place.providerPlaceId,
                    name: favorite.place.name,
                    address: favorite.place.address,
                    latitude: favorite.place.latitude,
                    longitude: favorite.place.longitude,
                    category: favorite.place.category,
                  }}
                  initialFavorite
                />
              </div>
              {favorite.place.address ? (
                <p className="flex items-start gap-2 text-sm text-neutral-600">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                  <span className="line-clamp-2">{favorite.place.address}</span>
                </p>
              ) : null}
              <div className="mt-auto pt-1">
                <AddToTripDialog
                  place={{
                    placeId: favorite.place.providerPlaceId,
                    name: favorite.place.name,
                    address: favorite.place.address,
                    latitude: favorite.place.latitude,
                    longitude: favorite.place.longitude,
                    category: favorite.place.category,
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
