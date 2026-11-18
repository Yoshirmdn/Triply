/*
  Warnings:

  - You are about to drop the `PlaceStat` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "PlaceStat";

-- CreateTable
CREATE TABLE "CatalogPlace" (
    "id" UUID NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PlaceCategory" NOT NULL DEFAULT 'OTHER',
    "categories" TEXT[],
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "priceRange" TEXT,
    "mapsUrl" TEXT,
    "photoUrl" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "description" TEXT,
    "openHours" JSONB,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogPlace_externalId_key" ON "CatalogPlace"("externalId");

-- CreateIndex
CREATE INDEX "CatalogPlace_latitude_longitude_idx" ON "CatalogPlace"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "CatalogPlace_category_idx" ON "CatalogPlace"("category");

-- CreateIndex
CREATE INDEX "CatalogPlace_city_idx" ON "CatalogPlace"("city");

-- CreateIndex
CREATE INDEX "CatalogPlace_province_idx" ON "CatalogPlace"("province");
