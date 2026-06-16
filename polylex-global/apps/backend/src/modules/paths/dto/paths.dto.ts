import { IsString, IsOptional, IsIn, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export class GeneratePathDto {
  @ApiProperty({ example: 'Du lịch Nhật Bản', description: 'Learning goal (free text)' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  goal: string;

  @ApiProperty({ example: 'ja', description: 'Target language code' })
  @IsString()
  targetLanguageCode: string;

  @ApiPropertyOptional({ example: 'vi', description: 'Native language code for translations' })
  @IsOptional()
  @IsString()
  nativeLanguageCode?: string;

  @ApiProperty({ example: 'B1', enum: CEFR_LEVELS })
  @IsIn(CEFR_LEVELS)
  targetCefrLevel: string;
}

export class PathStageVocabDto {
  id: string;
  term: string;
  phonetic?: string | null;
  phoneticRomaji?: string | null;
  cefrLevel?: string | null;
  partOfSpeech?: string | null;
  translation?: string | null;
  exampleSentence?: string | null;
}

export class VideoDto {
  id: string;
  youtubeVideoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds: number;
  aiReason: string;
}

export class PathStageDto {
  id: string;
  pathStageId: string;   // ID of the PathStage (distinct from id = UserPathStage.id)
  hasDialogue: boolean;  // true if a PathStageDialogue exists for this stage
  hasVideos: boolean;    // true if PathStageVideos exist for this stage
  order: number;
  title: string;
  description?: string | null;
  wordCount: number;
  xpReward: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  wordsLearned: number;
  vocab?: PathStageVocabDto[];
}

export class PathDto {
  id: string;
  pathTemplateId: string;
  title: string;
  description?: string | null;
  emoji: string;
  totalWords: number;
  currentStageOrder: number;
  completedAt?: Date | null;
  stages: PathStageDto[];
}

export class CompleteStageResponseDto {
  nextStageUnlocked: boolean;
  completedAt: string;
}

export class DialogueLineDto {
  speaker: 'A' | 'B';
  text: string;
  translation: string;
  vocabTerms: string[];
}

export class StageDialogueDto {
  pathStageId: string;
  stageTitle: string;
  targetLanguageCode: string;
  lines: DialogueLineDto[];
}
