-- CreateEnum
CREATE TYPE "QuickNoteStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'ERROR');

-- CreateTable
CREATE TABLE "quick_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "source_language_code" TEXT NOT NULL,
    "target_language_code" TEXT NOT NULL,
    "status" "QuickNoteStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "vocabulary_base_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quick_notes_user_id_status_idx" ON "quick_notes"("user_id", "status");

-- CreateIndex
CREATE INDEX "quick_notes_user_id_created_at_idx" ON "quick_notes"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "quick_notes" ADD CONSTRAINT "quick_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quick_notes" ADD CONSTRAINT "quick_notes_vocabulary_base_id_fkey" FOREIGN KEY ("vocabulary_base_id") REFERENCES "vocabulary_base"("id") ON DELETE SET NULL ON UPDATE CASCADE;
