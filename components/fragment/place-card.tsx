import { MapPin } from "lucide-react";
import { AddToTripDialog } from "@/components/fragment/add-to-trip-dialog";
import { FavoriteButton } from "@/components/fragment/favorite-button";
import { PLACE_CATEGORY_LABELS } from "@/data/places";
import type { PlaceDTO } from "@/@type/place";

type PlaceCardProps = {
  place: PlaceDTO & { isFavorite?: boolean };
  onFavoriteChange?: (placeId: string, isFavorite: boolean) => void;
};

export function PlaceCard({ place, onFavoriteChange }: PlaceCardProps) {
  const input = {
    placeId: place.placeId,
    name: place.name,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    category: place.category,
  };

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <span className="inline-block rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-900">
            {PLACE_CATEGORY_LABELS[place.category]}
          </span>
          <h3 className="line-clamp-2 font-semibold text-neutral-900">
            {place.name}
          </h3>
        </div>
        <FavoriteButton
          place={input}
          initialFavorite={place.isFavorite ?? false}
          onChange={(value) => onFavoriteChange?.(place.placeId, value)}
        />
      </div>

      {place.address ? (
        <p className="flex items-start gap-2 text-sm text-neutral-600">
          <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" />
          <span className="line-clamp-2">{place.address}</span>
        </p>
      ) : null}

      <div className="mt-auto pt-1">
        <AddToTripDialog place={input} />
      </div>
    </article>
  );
}
