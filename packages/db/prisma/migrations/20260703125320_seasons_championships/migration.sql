-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ChampionshipStatus" AS ENUM ('DRAFT', 'ACTIVE', 'FINISHED');

-- CreateTable
CREATE TABLE "season" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SeasonStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "championship" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rounds_count" INTEGER NOT NULL,
    "qualifiers_count" INTEGER NOT NULL,
    "status" "ChampionshipStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "championship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "championship_config" (
    "championship_id" UUID NOT NULL,
    "scoring_table" JSONB NOT NULL,
    "tiebreakers" JSONB NOT NULL,
    "draw_weights" JSONB NOT NULL,
    "randomness" INTEGER NOT NULL DEFAULT 50,
    "allow_repeat_partners" BOOLEAN NOT NULL DEFAULT false,
    "allow_repeat_opponents" BOOLEAN NOT NULL DEFAULT true,
    "final_config" JSONB NOT NULL,

    CONSTRAINT "championship_config_pkey" PRIMARY KEY ("championship_id")
);

-- CreateIndex
CREATE INDEX "season_club_id_idx" ON "season"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "season_club_id_year_key" ON "season"("club_id", "year");

-- CreateIndex
CREATE INDEX "championship_season_id_idx" ON "championship"("season_id");

-- AddForeignKey
ALTER TABLE "season" ADD CONSTRAINT "season_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "championship" ADD CONSTRAINT "championship_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "championship_config" ADD CONSTRAINT "championship_config_championship_id_fkey" FOREIGN KEY ("championship_id") REFERENCES "championship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
