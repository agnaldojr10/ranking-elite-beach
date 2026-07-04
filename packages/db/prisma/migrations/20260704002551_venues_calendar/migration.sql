-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('ROUND', 'FINAL', 'EVENT', 'TRAINING');

-- AlterTable
ALTER TABLE "match" ADD COLUMN     "venue_id" UUID;

-- CreateTable
CREATE TABLE "venue" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER,
    "location" TEXT,
    "availability" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_event" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "type" "CalendarEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "ref_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "venue_club_id_idx" ON "venue"("club_id");

-- CreateIndex
CREATE INDEX "calendar_event_club_id_date_idx" ON "calendar_event"("club_id", "date");

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue" ADD CONSTRAINT "venue_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
