-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "player" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "photo_url" TEXT,
    "birth_date" DATE NOT NULL,
    "phone" TEXT,
    "skill_level" "SkillLevel" NOT NULL DEFAULT 'INTERMEDIATE',
    "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "player_club_id_status_idx" ON "player"("club_id", "status");

-- CreateIndex
CREATE INDEX "player_club_id_name_idx" ON "player"("club_id", "name");

-- AddForeignKey
ALTER TABLE "player" ADD CONSTRAINT "player_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
