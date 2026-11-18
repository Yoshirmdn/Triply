import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { distanceMeters } from "@/lib/photo-match";
import { matchStat, STAT_MATCH_METERS } from "@/lib/stat-match";
import { FILTERABLE_CATEGORIES, type PlaceCategoryValue } from "@/data/places";
import type { OpenHours } from "@/lib/gmaps-import";
import type { PlaceDTO, PlaceDetailDTO, PlacePhotoDTO, PlaceStatDTO, PlaceSuggestionDTO } from "@/@type/place";

const METERS_PER_DEGREE = 111_320;
const MAX_CANDIDATES = 3000;

type CatalogRow = {
  externalId: string;
  name: string;
  category: PlaceCategoryValue;
  address: string | null;
  latitude: number;
  longitude: number;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  mapsUrl: string | null;
  photoUrl: string | null;
};

export function qualityScore(rating: number | null, reviewCount: number | null): number {
  const base = rating ?? 3.5;
  return base * Math.log10((reviewCount ?? 0) + 10);
}

export function toStat(row: Pick<CatalogRow, "rating" | "reviewCount" | "priceRange" | "mapsUrl" | "photoUrl">): PlaceStatDTO {
  return {
    rating: row.rating,
    reviewCount: row.reviewCount,
    priceRange: row.priceRange,
    mapsUrl: row.mapsUrl,
    photoUrl: row.photoUrl,
  };
}

export function toPlaceDTO(row: CatalogRow): PlaceDTO {
  return {
    placeId: row.externalId,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    category: row.category,
    stat: toStat(row),
  };
}

function boundingBox(lat: number, lng: number, radius: number) {
  const latDelta = radius / METERS_PER_DEGREE;
  const lngDelta = radius / (METERS_PER_DEGREE * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return {
    latitude: { gte: lat - latDelta, lte: lat + latDelta },
    longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
  };
}

type SearchInput = {
  lat: number;
  lng: number;
  radius: number;
  limit: number;
  page: number;
  category?: PlaceCategoryValue;
  name?: string;
  minRating?: number;
};

export async function searchCatalog(input: SearchInput): Promise<{ places: PlaceDTO[]; hasMore: boolean }> {
  const where: Prisma.CatalogPlaceWhereInput = {
    ...boundingBox(input.lat, input.lng, input.radius),
    category: input.category ? input.category : { not: "OTHER" },
  };
  if (input.name) where.name = { contains: input.name, mode: "insensitive" };
  if (input.minRating !== undefined) {
    where.OR = [{ rating: null }, { rating: { gte: input.minRating } }];
  }

  const rows = await prisma.catalogPlace.findMany({
    where,
    orderBy: [{ reviewCount: { sort: "desc", nulls: "last" } }, { id: "asc" }],
    take: MAX_CANDIDATES,
  });

  const scored = rows
    .map((row) => {
      const distance = distanceMeters(input.lat, input.lng, row.latitude, row.longitude);
      return { row, distance, score: qualityScore(row.rating, row.reviewCount) * (1 - 0.5 * Math.min(1, distance / input.radius)) };
    })
    .filter((entry) => entry.distance <= input.radius);

  scored.sort(input.name ? (a, b) => a.distance - b.distance : (a, b) => b.score - a.score || a.distance - b.distance);

  let ordered = scored;
  if (!input.category && !input.name) {
    const lists = FILTERABLE_CATEGORIES.map((category) => scored.filter((entry) => entry.row.category === category));
    const longest = Math.max(...lists.map((list) => list.length), 0);
    ordered = [];
    for (let index = 0; index < longest; index += 1) {
      for (const list of lists) {
        const entry = list[index];
        if (entry) ordered.push(entry);
      }
    }
  }

  const start = (input.page - 1) * input.limit;
  const slice = ordered.slice(start, start + input.limit);
  return { places: slice.map((entry) => toPlaceDTO(entry.row)), hasMore: start + input.limit < ordered.length };
}

export async function attachStats<T extends PlaceDTO>(places: T[]): Promise<T[]> {
  const missing = places.filter((place) => !place.stat);
  if (missing.length === 0) return places;

  try {
    const rows = await prisma.catalogPlace.findMany({ where: { externalId: { in: missing.map((place) => place.placeId) } } });
    const byId = new Map(rows.map((row) => [row.externalId, row]));
    return places.map((place) => {
      const row = byId.get(place.placeId);
      return row && !place.stat ? { ...place, stat: toStat(row) } : place;
    });
  } catch (error) {
    console.error(error);
    return places;
  }
}

function formatHours(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const entries = Object.entries(value as OpenHours);
  if (entries.length === 0) return null;
  return entries.map(([day, slots]) => `${day}: ${slots.join(", ")}`).join("; ");
}

export async function getCatalogDetail(externalId: string): Promise<PlaceDetailDTO | null> {
  const row = await prisma.catalogPlace.findUnique({ where: { externalId } });
  if (!row) return null;
  return {
    ...toPlaceDTO(row),
    websiteUri: row.website,
    phone: row.phone,
    openingHours: formatHours(row.openHours),
  };
}

type Region = { city: string | null; province: string | null; _count: { _all: number }; _avg: { latitude: number | null; longitude: number | null } };

async function matchRegions(text: string, take: number): Promise<Region[]> {
  const rows = await prisma.catalogPlace.groupBy({
    by: ["city", "province"],
    where: {
      city: { not: null },
      OR: [{ city: { contains: text, mode: "insensitive" } }, { province: { contains: text, mode: "insensitive" } }],
    },
    _count: { _all: true },
    _avg: { latitude: true, longitude: true },
    orderBy: { _count: { city: "desc" } },
    take,
  });
  return rows;
}

export async function autocompleteLocations(input: { text: string; limit?: number }): Promise<PlaceSuggestionDTO[]> {
  const limit = input.limit ?? 6;
  const [regions, places] = await Promise.all([
    matchRegions(input.text, 4),
    prisma.catalogPlace.findMany({
      where: { name: { contains: input.text, mode: "insensitive" }, category: { not: "OTHER" } },
      orderBy: [{ reviewCount: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      take: limit,
    }),
  ]);

  const result: PlaceSuggestionDTO[] = [];
  for (const region of regions) {
    if (!region.city || region._avg.latitude === null || region._avg.longitude === null) continue;
    result.push({
      key: `area:${region.city}|${region.province ?? ""}`,
      primaryText: region.city,
      secondaryText: `${region.province ?? "Indonesia"} · ${region._count._all} tempat`,
      latitude: region._avg.latitude,
      longitude: region._avg.longitude,
    });
  }
  for (const place of places) {
    result.push({
      key: `place:${place.externalId}`,
      primaryText: place.name,
      secondaryText: [place.city, place.province].filter(Boolean).join(", ") || place.address,
      latitude: place.latitude,
      longitude: place.longitude,
    });
  }
  return result.slice(0, limit);
}

export async function geocodeFirst(text: string): Promise<{ latitude: number; longitude: number } | null> {
  const query = text.trim();
  if (query.length < 2) return null;

  const regions = await matchRegions(query, 10);
  let total = 0;
  let latitude = 0;
  let longitude = 0;
  for (const region of regions) {
    if (region._avg.latitude === null || region._avg.longitude === null) continue;
    total += region._count._all;
    latitude += region._avg.latitude * region._count._all;
    longitude += region._avg.longitude * region._count._all;
  }
  if (total > 0) return { latitude: latitude / total, longitude: longitude / total };

  const place = await prisma.catalogPlace.findFirst({
    where: { name: { contains: query, mode: "insensitive" } },
    orderBy: [{ reviewCount: { sort: "desc", nulls: "last" } }, { id: "asc" }],
    select: { latitude: true, longitude: true },
  });
  return place ?? null;
}

export async function countNearby(lat: number, lng: number, radius: number): Promise<number> {
  return prisma.catalogPlace.count({
    where: { ...boundingBox(lat, lng, radius), category: { not: "OTHER" } },
  });
}

function toPhoto(row: { name: string; photoUrl: string | null; mapsUrl: string | null }): PlacePhotoDTO | null {
  if (!row.photoUrl) return null;
  return { url: row.photoUrl, title: row.name, pageUrl: row.mapsUrl ?? row.photoUrl };
}

export async function findCatalogPhoto(input: {
  name: string;
  lat?: number;
  lng?: number;
  kind: "place" | "destination";
}): Promise<PlacePhotoDTO | null> {
  if (input.kind === "destination") {
    const row = await prisma.catalogPlace.findFirst({
      where: {
        photoUrl: { not: null },
        category: { in: ["ATTRACTION", "NATURE", "MUSEUM"] },
        OR: [
          { city: { contains: input.name, mode: "insensitive" } },
          { province: { contains: input.name, mode: "insensitive" } },
          { address: { contains: input.name, mode: "insensitive" } },
        ],
      },
      orderBy: [{ reviewCount: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      select: { name: true, photoUrl: true, mapsUrl: true },
    });
    return row ? toPhoto(row) : null;
  }

  if (input.lat !== undefined && input.lng !== undefined) {
    const rows = await prisma.catalogPlace.findMany({
      where: { ...boundingBox(input.lat, input.lng, STAT_MATCH_METERS), photoUrl: { not: null } },
      take: 50,
    });
    const match = matchStat({ name: input.name, latitude: input.lat, longitude: input.lng }, rows);
    return match ? toPhoto(match) : null;
  }

  const row = await prisma.catalogPlace.findFirst({
    where: { name: { equals: input.name, mode: "insensitive" }, photoUrl: { not: null } },
    orderBy: [{ reviewCount: { sort: "desc", nulls: "last" } }, { id: "asc" }],
    select: { name: true, photoUrl: true, mapsUrl: true },
  });
  return row ? toPhoto(row) : null;
}