-- CreateEnum
CREATE TYPE "MatchPhase" AS ENUM ('GROUP', 'KNOCKOUT');

-- AlterTable
ALTER TABLE "match" ADD COLUMN     "phase" "MatchPhase" NOT NULL DEFAULT 'GROUP',
ADD COLUMN     "round_id" UUID,
ADD COLUMN     "slot" INTEGER,
ADD COLUMN     "stage" TEXT,
ALTER COLUMN "group_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "round_result" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "final_position" INTEGER NOT NULL,
    "points_awarded" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "round_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "round_result_round_id_team_id_key" ON "round_result"("round_id", "team_id");

-- CreateIndex
CREATE INDEX "match_round_id_phase_idx" ON "match"("round_id", "phase");

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_result" ADD CONSTRAINT "round_result_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_result" ADD CONSTRAINT "round_result_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
