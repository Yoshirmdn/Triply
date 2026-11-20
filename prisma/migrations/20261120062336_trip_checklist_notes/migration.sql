-- CreateEnum
CREATE TYPE "ChecklistKind" AS ENUM ('PACKING', 'TODO');

-- CreateEnum
CREATE TYPE "NoteKind" AS ENUM ('NOTE', 'BOOKING');

-- CreateTable
CREATE TABLE "TripChecklistItem" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "kind" "ChecklistKind" NOT NULL DEFAULT 'PACKING',
    "text" VARCHAR(160) NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripNote" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "kind" "NoteKind" NOT NULL DEFAULT 'NOTE',
    "title" VARCHAR(160) NOT NULL,
    "content" TEXT,
    "reference" VARCHAR(80),
    "url" VARCHAR(500),
    "dayNumber" INTEGER,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripChecklistItem_tripId_kind_idx" ON "TripChecklistItem"("tripId", "kind");

-- CreateIndex
CREATE INDEX "TripNote_tripId_kind_idx" ON "TripNote"("tripId", "kind");

-- AddForeignKey
ALTER TABLE "TripChecklistItem" ADD CONSTRAINT "TripChecklistItem_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripNote" ADD CONSTRAINT "TripNote_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
