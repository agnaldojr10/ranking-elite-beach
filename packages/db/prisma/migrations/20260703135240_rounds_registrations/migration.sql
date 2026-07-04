-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('SCHEDULED', 'OPEN', 'DRAWN', 'IN_PROGRESS', 'FINISHED');

-- CreateEnum
CREATE TYPE "RoundKind" AS ENUM ('REGULAR', 'FINAL_PHASE');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('CONFIRMED', 'PENDING', 'ABSENT', 'WAITLIST');

-- CreateTable
CREATE TABLE "round" (
    "id" UUID NOT NULL,
    "championship_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "date" DATE,
    "status" "RoundStatus" NOT NULL DEFAULT 'SCHEDULED',
    "kind" "RoundKind" NOT NULL DEFAULT 'REGULAR',
    "match_format" JSONB NOT NULL,
    "group_size_pref" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "substituted_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "round_championship_id_idx" ON "round"("championship_id");

-- CreateIndex
CREATE UNIQUE INDEX "round_championship_id_number_key" ON "round"("championship_id", "number");

-- CreateIndex
CREATE INDEX "registration_round_id_status_idx" ON "registration"("round_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "registration_round_id_player_id_key" ON "registration"("round_id", "player_id");

-- AddForeignKey
ALTER TABLE "round" ADD CONSTRAINT "round_championship_id_fkey" FOREIGN KEY ("championship_id") REFERENCES "championship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration" ADD CONSTRAINT "registration_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration" ADD CONSTRAINT "registration_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration" ADD CONSTRAINT "registration_substituted_by_fkey" FOREIGN KEY ("substituted_by") REFERENCES "player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
