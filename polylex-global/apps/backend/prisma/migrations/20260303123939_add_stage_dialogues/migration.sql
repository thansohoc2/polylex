-- CreateTable
CREATE TABLE "path_stage_dialogues" (
    "id" TEXT NOT NULL,
    "path_stage_id" TEXT NOT NULL,
    "lines" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "path_stage_dialogues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "path_stage_dialogues_path_stage_id_key" ON "path_stage_dialogues"("path_stage_id");

-- AddForeignKey
ALTER TABLE "path_stage_dialogues" ADD CONSTRAINT "path_stage_dialogues_path_stage_id_fkey" FOREIGN KEY ("path_stage_id") REFERENCES "path_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
