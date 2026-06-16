-- CreateTable
CREATE TABLE "path_stage_videos" (
    "id" TEXT NOT NULL,
    "path_stage_id" TEXT NOT NULL,
    "youtube_video_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel_title" TEXT,
    "thumbnail_url" TEXT,
    "duration_seconds" INTEGER,
    "relevance_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "ai_reason" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "path_stage_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "path_stage_videos_path_stage_id_idx" ON "path_stage_videos"("path_stage_id");

-- CreateIndex
CREATE INDEX "user_streaks_weekly_xp_user_id_idx" ON "user_streaks"("weekly_xp" DESC, "user_id");

-- AddForeignKey
ALTER TABLE "path_stage_videos" ADD CONSTRAINT "path_stage_videos_path_stage_id_fkey" FOREIGN KEY ("path_stage_id") REFERENCES "path_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
