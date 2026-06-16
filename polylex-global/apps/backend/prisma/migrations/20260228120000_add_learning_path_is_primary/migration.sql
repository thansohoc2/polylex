-- AlterTable
ALTER TABLE "learning_paths" ADD COLUMN "is_primary" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: set the first active learning path per user as primary
WITH first_active AS (
  SELECT DISTINCT ON ("user_id") "id"
  FROM "learning_paths"
  WHERE "is_active" = true
  ORDER BY "user_id", "started_at" ASC, "id" ASC
)
UPDATE "learning_paths" lp
SET "is_primary" = true
FROM first_active fa
WHERE lp."id" = fa."id";
