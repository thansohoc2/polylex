-- CreateTable
CREATE TABLE "path_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT NOT NULL DEFAULT '🎯',
    "goal_input" TEXT NOT NULL,
    "target_language_id" TEXT NOT NULL,
    "native_language_id" TEXT,
    "target_cefr_level" TEXT NOT NULL,
    "total_words" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "path_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "path_stages" (
    "id" TEXT NOT NULL,
    "path_template_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "xp_reward" INTEGER NOT NULL DEFAULT 20,
    "word_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "path_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "path_stage_vocabs" (
    "id" TEXT NOT NULL,
    "path_stage_id" TEXT NOT NULL,
    "vocabulary_base_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "path_stage_vocabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_paths" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "path_template_id" TEXT NOT NULL,
    "current_stage_order" INTEGER NOT NULL DEFAULT 1,
    "total_xp_earned" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "user_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_path_stages" (
    "id" TEXT NOT NULL,
    "user_path_id" TEXT NOT NULL,
    "path_stage_id" TEXT NOT NULL,
    "is_unlocked" BOOLEAN NOT NULL DEFAULT false,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "words_learned" INTEGER NOT NULL DEFAULT 0,
    "unlocked_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "user_path_stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "path_templates_target_language_id_idx" ON "path_templates"("target_language_id");

-- CreateIndex
CREATE INDEX "path_stages_path_template_id_idx" ON "path_stages"("path_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "path_stages_path_template_id_order_key" ON "path_stages"("path_template_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "path_stage_vocabs_path_stage_id_vocabulary_base_id_key" ON "path_stage_vocabs"("path_stage_id", "vocabulary_base_id");

-- CreateIndex
CREATE INDEX "user_paths_user_id_idx" ON "user_paths"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_paths_user_id_path_template_id_key" ON "user_paths"("user_id", "path_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_path_stages_user_path_id_path_stage_id_key" ON "user_path_stages"("user_path_id", "path_stage_id");

-- AddForeignKey
ALTER TABLE "path_templates" ADD CONSTRAINT "path_templates_target_language_id_fkey" FOREIGN KEY ("target_language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_templates" ADD CONSTRAINT "path_templates_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_stages" ADD CONSTRAINT "path_stages_path_template_id_fkey" FOREIGN KEY ("path_template_id") REFERENCES "path_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_stage_vocabs" ADD CONSTRAINT "path_stage_vocabs_path_stage_id_fkey" FOREIGN KEY ("path_stage_id") REFERENCES "path_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_stage_vocabs" ADD CONSTRAINT "path_stage_vocabs_vocabulary_base_id_fkey" FOREIGN KEY ("vocabulary_base_id") REFERENCES "vocabulary_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_paths" ADD CONSTRAINT "user_paths_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_paths" ADD CONSTRAINT "user_paths_path_template_id_fkey" FOREIGN KEY ("path_template_id") REFERENCES "path_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_path_stages" ADD CONSTRAINT "user_path_stages_user_path_id_fkey" FOREIGN KEY ("user_path_id") REFERENCES "user_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_path_stages" ADD CONSTRAINT "user_path_stages_path_stage_id_fkey" FOREIGN KEY ("path_stage_id") REFERENCES "path_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
