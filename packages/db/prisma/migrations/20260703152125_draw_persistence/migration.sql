-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'PLAYED', 'WALKOVER');

-- CreateTable
CREATE TABLE "draw" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "seed" TEXT NOT NULL,
    "config_snapshot" JSONB NOT NULL,
    "quality_score" DOUBLE PRECISION NOT NULL,
    "metrics" JSONB NOT NULL,
    "explanations" JSONB NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "draw_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "strength" INTEGER NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_player" (
    "team_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,

    CONSTRAINT "team_player_pkey" PRIMARY KEY ("team_id","player_id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "draw_id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_team" (
    "group_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "seed" INTEGER NOT NULL,

    CONSTRAINT "group_team_pkey" PRIMARY KEY ("group_id","team_id")
);

-- CreateTable
CREATE TABLE "match" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "team_a_id" UUID NOT NULL,
    "team_b_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "sets" JSONB,
    "winner_team_id" UUID,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "is_walkover" BOOLEAN NOT NULL DEFAULT false,
    "walkover_injury" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_history" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "player_a_id" UUID NOT NULL,
    "player_b_id" UUID NOT NULL,
    "times_together" INTEGER NOT NULL DEFAULT 0,
    "last_round_id" UUID,

    CONSTRAINT "partner_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opponent_history" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "player_a_id" UUID NOT NULL,
    "player_b_id" UUID NOT NULL,
    "times_faced" INTEGER NOT NULL DEFAULT 0,
    "last_round_id" UUID,

    CONSTRAINT "opponent_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "draw_round_id_key" ON "draw"("round_id");

-- CreateIndex
CREATE INDEX "team_draw_id_idx" ON "team"("draw_id");

-- CreateIndex
CREATE INDEX "team_player_player_id_idx" ON "team_player"("player_id");

-- CreateIndex
CREATE INDEX "group_draw_id_idx" ON "group"("draw_id");

-- CreateIndex
CREATE INDEX "match_group_id_status_idx" ON "match"("group_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "partner_history_club_id_player_a_id_player_b_id_key" ON "partner_history"("club_id", "player_a_id", "player_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "opponent_history_club_id_player_a_id_player_b_id_key" ON "opponent_history"("club_id", "player_a_id", "player_b_id");

-- AddForeignKey
ALTER TABLE "draw" ADD CONSTRAINT "draw_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw" ADD CONSTRAINT "draw_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_draw_id_fkey" FOREIGN KEY ("draw_id") REFERENCES "draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_player" ADD CONSTRAINT "team_player_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_player" ADD CONSTRAINT "team_player_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group" ADD CONSTRAINT "group_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group" ADD CONSTRAINT "group_draw_id_fkey" FOREIGN KEY ("draw_id") REFERENCES "draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_team" ADD CONSTRAINT "group_team_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_team" ADD CONSTRAINT "group_team_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_team_a_id_fkey" FOREIGN KEY ("team_a_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_team_b_id_fkey" FOREIGN KEY ("team_b_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_history" ADD CONSTRAINT "partner_history_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opponent_history" ADD CONSTRAINT "opponent_history_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
