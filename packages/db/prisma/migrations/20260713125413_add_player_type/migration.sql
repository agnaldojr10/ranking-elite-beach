-- CreateEnum
CREATE TYPE "PlayerType" AS ENUM ('REGULAR', 'GUEST');

-- AlterTable
ALTER TABLE "player" ADD COLUMN     "player_type" "PlayerType" NOT NULL DEFAULT 'REGULAR';
