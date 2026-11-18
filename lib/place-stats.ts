// import "server-only";
// import { prisma } from "@/lib/prisma";
// import { matchStat, STAT_MATCH_METERS } from "@/lib/stat-match";
// import type { PlaceDTO } from "@/@type/place";

// const MARGIN_DEGREES = STAT_MATCH_METERS / 100_000;
// const MAX_STATS = 5000;

// export async function attachStats<T extends PlaceDTO>(
//   places: T[],
// ): Promise<T[]> {
//   if (places.length === 0) return places;

//   try {
//     const latitudes = places.map((place) => place.latitude);
//     const longitudes = places.map((place) => place.longitude);

//     const stats = await prisma.placeStat.findMany({
//       where: {
//         latitude: {
//           gte: Math.min(...latitudes) - MARGIN_DEGREES,
//           lte: Math.max(...latitudes) + MARGIN_DEGREES,
//         },
//         longitude: {
//           gte: Math.min(...longitudes) - MARGIN_DEGREES,
//           lte: Math.max(...longitudes) + MARGIN_DEGREES,
//         },
//       },
//       take: MAX_STATS,
//     });
//     if (stats.length === 0) return places;

//     return places.map((place) => {
//       const match = matchStat(place, stats);
//       if (!match) return place;
//       return {
//         ...place,
//         stat: {
//           rating: match.rating,
//           reviewCount: match.reviewCount,
//           priceRange: match.priceRange,
//           mapsUrl: match.mapsUrl,
//           photoUrl: match.photoUrl ?? null,
//         },
//       };
//     });
//   } catch (error) {
//     console.error(error);
//     return places;
//   }
// }
export { attachStats } from "@/lib/catalog";