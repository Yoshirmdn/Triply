"use client";

import { ExternalLink, MapPin, Star } from "lucide-react";
import { AddToTripDialog } from "@/components/fragment/add-to-trip-dialog";
import { FavoriteButton } from "@/components/fragment/favorite-button";
import { PlacePhoto } from "@/components/fragment/place-photo";
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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md">
      <PlacePhoto
        name={place.name}
        latitude={place.latitude}
        longitude={place.longitude}
        category={place.category}
        src={place.stat?.photoUrl ?? null}
        showCredit
        className="h-40 w-full"
        iconClassName="size-10"
      >
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-teal-900 backdrop-blur">
          {PLACE_CATEGORY_LABELS[place.category]}
        </span>
      </PlacePhoto>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-semibold text-neutral-900">
            {place.name}
          </h3>
          <FavoriteButton
            place={input}
            initialFavorite={place.isFavorite ?? false}
            onChange={(value) => onFavoriteChange?.(place.placeId, value)}
          />
        </div>

        {place.stat && place.stat.rating !== null ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-700">
            <span className="inline-flex items-center gap-1 font-medium">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {place.stat.rating.toFixed(1)}
            </span>
            {place.stat.reviewCount !== null ? (
              <span className="text-neutral-500">
                ({place.stat.reviewCount.toLocaleString("id-ID")} ulasan)
              </span>
            ) : null}
            {place.stat.priceRange ? (
              <span className="text-neutral-500">
                · {place.stat.priceRange}
              </span>
            ) : null}
            {place.stat.mapsUrl ? (
              <a
                href={place.stat.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-800 hover:underline"
              >
                Google Maps
                <ExternalLink className="size-3" />
              </a>
            ) : null}
          </p>
        ) : null}

        {place.address ? (
          <p className="flex items-start gap-2 text-sm text-neutral-600">
            <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" />
            <span className="line-clamp-2">{place.address}</span>
          </p>
        ) : null}

        <div className="mt-auto pt-1">
          <AddToTripDialog place={input} />
        </div>
      </div>
    </article>
  );
}
