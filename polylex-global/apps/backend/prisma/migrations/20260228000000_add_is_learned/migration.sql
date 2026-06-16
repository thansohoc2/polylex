-- AlterTable
ALTER TABLE "user_vocabulary" ADD COLUMN "is_learned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "user_vocabulary_user_id_is_learned_idx" ON "user_vocabulary"("user_id", "is_learned");

-- Backfill: mark as learned any word that has been reviewed at least once
UPDATE "user_vocabulary" SET "is_learned" = true WHERE review_count >= 1;
