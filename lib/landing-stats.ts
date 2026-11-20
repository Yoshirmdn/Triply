import "server-only";
import { prisma } from "@/lib/prisma";
import { countArea, toPlaceDTO } from "@/lib/catalog";
import { POPULAR_DESTINATIONS } from "@/data/landing";
import type { PlaceDTO } from "@/@type/place";

export type LandingStats = {
  total: number;
  rated: number;
  counts: Record<string, number>;
  top: PlaceDTO[];
};

export async function getLandingStats(): Promise<LandingStats | null> {
  try {
    const [total, rated, topRows, counts] = await Promise.all([
      prisma.catalogPlace.count({ where: { category: { not: "OTHER" } } }),
      prisma.catalogPlace.count({
        where: { category: { not: "OTHER" }, rating: { not: null } },
      }),
      prisma.catalogPlace.findMany({
        where: {
          photoUrl: { not: null },
          rating: { gte: 4.5 },
          reviewCount: { gte: 300 },
          category: { in: ["ATTRACTION", "NATURE", "MUSEUM", "ENTERTAINMENT"] },
        },
        orderBy: [
          { reviewCount: { sort: "desc", nulls: "last" } },
          { id: "asc" },
        ],
        take: 6,
      }),
      Promise.all(
        POPULAR_DESTINATIONS.map(
          async (destination) =>
            [destination.name, await countArea(destination.name)] as const,
        ),
      ),
    ]);

    return {
      total,
      rated,
      counts: Object.fromEntries(counts),
      top: topRows.map(toPlaceDTO),
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}
