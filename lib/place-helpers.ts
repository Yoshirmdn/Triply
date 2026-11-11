import "server-only";
import { prisma } from "@/lib/prisma";
import { PLACE_PROVIDER } from "@/data/places";
import type { PlaceInput } from "@/lib/validations/place.schema";

export async function upsertPlace(input: PlaceInput) {
  return prisma.place.upsert({
    where: {
      provider_providerPlaceId: {
        provider: PLACE_PROVIDER,
        providerPlaceId: input.placeId,
      },
    },
    create: {
      provider: PLACE_PROVIDER,
      providerPlaceId: input.placeId,
      name: input.name,
      address: input.address ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      category: input.category,
    },
    update: {
      name: input.name,
      address: input.address ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      category: input.category,
      refreshedAt: new Date(),
    },
  });
}

export function serializeSavedPlace(place: {
  id: string;
  providerPlaceId: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  category:
    | "ATTRACTION"
    | "RESTAURANT"
    | "CAFE"
    | "HOTEL"
    | "SHOPPING"
    | "MUSEUM"
    | "NATURE"
    | "ENTERTAINMENT"
    | "OTHER";
}) {
  return {
    id: place.id,
    placeId: place.providerPlaceId,
    name: place.name,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    category: place.category,
  };
}
