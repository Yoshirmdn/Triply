-- CreateTable
CREATE TABLE "PlaceStat" (
    "id" UUID NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "priceRange" TEXT,
    "mapsUrl" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaceStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaceStat_externalId_key" ON "PlaceStat"("externalId");

-- CreateIndex
CREATE INDEX "PlaceStat_latitude_longitude_idx" ON "PlaceStat"("latitude", "longitude");
