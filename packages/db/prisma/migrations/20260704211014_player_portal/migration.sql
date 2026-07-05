/*
  Warnings:

  - A unique constraint covering the columns `[player_id]` on the table `app_user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "player_invite" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_invite_code_hash_key" ON "player_invite"("code_hash");

-- CreateIndex
CREATE INDEX "player_invite_player_id_idx" ON "player_invite"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_player_id_key" ON "app_user"("player_id");

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_invite" ADD CONSTRAINT "player_invite_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
