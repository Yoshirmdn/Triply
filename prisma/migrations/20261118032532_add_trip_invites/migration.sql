-- CreateTable
CREATE TABLE "TripInvite" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "TripMemberRole" NOT NULL DEFAULT 'VIEWER',
    "invitedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripInvite_email_idx" ON "TripInvite"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TripInvite_tripId_email_key" ON "TripInvite"("tripId", "email");

-- AddForeignKey
ALTER TABLE "TripInvite" ADD CONSTRAINT "TripInvite_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
