-- AlterTable
ALTER TABLE "match" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_by" UUID;

-- CreateTable
CREATE TABLE "match_result_log" (
    "id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "changed_by" UUID NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_result_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "match_result_log_match_id_idx" ON "match_result_log"("match_id");

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_result_log" ADD CONSTRAINT "match_result_log_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_result_log" ADD CONSTRAINT "match_result_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
