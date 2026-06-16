-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LEARNER', 'ADMIN');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "native_name" TEXT NOT NULL,
    "rtl" BOOLEAN NOT NULL DEFAULT false,
    "flag_emoji" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'LEARNER',
    "native_language_id" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "organization_id" TEXT,
    "daily_goal" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "refresh_token" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_base" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "language_id" TEXT NOT NULL,
    "cefr_level" TEXT,
    "part_of_speech" TEXT,
    "phonetic" TEXT,
    "image_url" TEXT,
    "audio_url" TEXT,
    "example_sentence" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocabulary_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_translations" (
    "id" TEXT NOT NULL,
    "vocabulary_base_id" TEXT NOT NULL,
    "target_language_id" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "definition" TEXT,
    "example_translation" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabulary_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_vocabulary" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vocabulary_base_id" TEXT NOT NULL,
    "memory_strength" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "interval_days" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "next_review" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leech_score" INTEGER NOT NULL DEFAULT 0,
    "difficulty_user" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "is_leech" BOOLEAN NOT NULL DEFAULT false,
    "is_suspended" BOOLEAN NOT NULL DEFAULT false,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_reviewed_at" TIMESTAMP(3),

    CONSTRAINT "user_vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vocabulary_base_id" TEXT NOT NULL,
    "review_mode" TEXT NOT NULL,
    "recall_quality" INTEGER NOT NULL,
    "response_time_ms" INTEGER NOT NULL,
    "confidence_level" INTEGER NOT NULL,
    "memory_strength_before" DOUBLE PRECISION NOT NULL,
    "memory_strength_after" DOUBLE PRECISION NOT NULL,
    "interval_days" DOUBLE PRECISION NOT NULL,
    "is_leech" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_language_id" TEXT NOT NULL,
    "target_cefr_level" TEXT NOT NULL,
    "current_cefr_level" TEXT NOT NULL DEFAULT 'A1',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_streaks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_active_date" TIMESTAMP(3),
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "weekly_xp" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "vocabulary_base_language_id_idx" ON "vocabulary_base"("language_id");

-- CreateIndex
CREATE INDEX "vocabulary_base_organization_id_idx" ON "vocabulary_base"("organization_id");

-- CreateIndex
CREATE INDEX "vocabulary_base_cefr_level_idx" ON "vocabulary_base"("cefr_level");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_base_term_language_id_organization_id_key" ON "vocabulary_base"("term", "language_id", "organization_id");

-- CreateIndex
CREATE INDEX "vocabulary_translations_target_language_id_idx" ON "vocabulary_translations"("target_language_id");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_translations_vocabulary_base_id_target_language__key" ON "vocabulary_translations"("vocabulary_base_id", "target_language_id");

-- CreateIndex
CREATE INDEX "user_vocabulary_user_id_next_review_idx" ON "user_vocabulary"("user_id", "next_review");

-- CreateIndex
CREATE INDEX "user_vocabulary_user_id_is_leech_idx" ON "user_vocabulary"("user_id", "is_leech");

-- CreateIndex
CREATE UNIQUE INDEX "user_vocabulary_user_id_vocabulary_base_id_key" ON "user_vocabulary"("user_id", "vocabulary_base_id");

-- CreateIndex
CREATE INDEX "review_history_user_id_reviewed_at_idx" ON "review_history"("user_id", "reviewed_at");

-- CreateIndex
CREATE INDEX "review_history_user_id_vocabulary_base_id_idx" ON "review_history"("user_id", "vocabulary_base_id");

-- CreateIndex
CREATE INDEX "learning_paths_user_id_idx" ON "learning_paths"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_user_id_target_language_id_key" ON "learning_paths"("user_id", "target_language_id");

-- CreateIndex
CREATE INDEX "skill_scores_user_id_idx" ON "skill_scores"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_scores_user_id_skill_key" ON "skill_scores"("user_id", "skill");

-- CreateIndex
CREATE UNIQUE INDEX "user_streaks_user_id_key" ON "user_streaks"("user_id");

-- CreateIndex
CREATE INDEX "user_badges_user_id_idx" ON "user_badges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_key" ON "user_badges"("user_id", "badge");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_native_language_id_fkey" FOREIGN KEY ("native_language_id") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_base" ADD CONSTRAINT "vocabulary_base_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_base" ADD CONSTRAINT "vocabulary_base_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_translations" ADD CONSTRAINT "vocabulary_translations_vocabulary_base_id_fkey" FOREIGN KEY ("vocabulary_base_id") REFERENCES "vocabulary_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_translations" ADD CONSTRAINT "vocabulary_translations_target_language_id_fkey" FOREIGN KEY ("target_language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabulary" ADD CONSTRAINT "user_vocabulary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabulary" ADD CONSTRAINT "user_vocabulary_vocabulary_base_id_fkey" FOREIGN KEY ("vocabulary_base_id") REFERENCES "vocabulary_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_history" ADD CONSTRAINT "review_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_target_language_id_fkey" FOREIGN KEY ("target_language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_scores" ADD CONSTRAINT "skill_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
