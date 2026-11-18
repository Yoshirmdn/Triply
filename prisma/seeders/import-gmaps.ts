import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../lib/generated/prisma/client";
import { parseScrapeText } from "../../lib/gmaps-import";

async function main() {
  const file = process.argv[2];
  const connectionString = process.env.DATABASE_URL;
  if (!file) throw new Error("Usage: npm run db:import-gmaps -- <path-to-results.json>");
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const { places, skipped } = parseScrapeText(readFileSync(resolve(file), "utf8"));
  if (places.length === 0) {
    console.log(`Tidak ada data valid. Dilewati: ${skipped}`);
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    for (let index = 0; index < places.length; index += 50) {
      const chunk = places.slice(index, index + 50);
      await Promise.all(
        chunk.map((place) => {
          const { openHours, ...rest } = place;
          const hours = openHours ?? Prisma.DbNull;
          return prisma.catalogPlace.upsert({
            where: { externalId: place.externalId },
            create: { ...rest, openHours: hours },
            update: { ...rest, openHours: hours },
          });
        }),
      );
    }
    console.log(`Diimpor: ${places.length}. Dilewati: ${skipped}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});