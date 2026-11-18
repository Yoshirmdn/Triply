import { distanceMeters, titleMatches } from "@/lib/photo-match";

export type StatRecord = {
  name: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  mapsUrl: string | null;
  photoUrl?: string | null;
};

type Target = { name: string; latitude: number; longitude: number };

export const STAT_MATCH_METERS = 150;

export function matchStat<T extends StatRecord>(
  place: Target,
  stats: T[],
  maxMeters = STAT_MATCH_METERS,
): T | null {
  let best: T | null = null;
  let bestDistance = Infinity;

  for (const stat of stats) {
    const distance = distanceMeters(
      place.latitude,
      place.longitude,
      stat.latitude,
      stat.longitude,
    );
    if (distance > maxMeters || distance >= bestDistance) continue;
    if (
      !titleMatches(place.name, stat.name) &&
      !titleMatches(stat.name, place.name)
    )
      continue;
    best = stat;
    bestDistance = distance;
  }

  return best;
}
