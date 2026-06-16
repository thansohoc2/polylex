import {
  IsString,
  IsInt,
  Min,
  Max,
  IsIn,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewMode } from '@polylex/shared-types';

const REVIEW_MODES: ReviewMode[] = [
  'flashcard',
  'type_answer',
  'reverse',
  'listening',
  'context',
  'sentence',
];

export class SubmitReviewDto {
  @ApiProperty({ description: 'UserVocabulary ID' })
  @IsString()
  userVocabularyId: string;

  @ApiProperty({ enum: REVIEW_MODES })
  @IsIn(REVIEW_MODES)
  reviewMode: ReviewMode;

  @ApiProperty({ minimum: 0, maximum: 5 })
  @IsInt()
  @Min(0)
  @Max(5)
  recallQuality: number;

  @ApiProperty({ description: 'Response time in milliseconds' })
  @IsInt()
  @Min(0)
  responseTimeMs: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  confidenceLevel: number;
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const SOURCE_TYPES = ['quicknote', 'path', 'manual'] as const;

export class ReviewQueueQueryDto {
  @ApiPropertyOptional({ example: 'en', description: 'Filter by language code' })
  @IsOptional()
  @IsString()
  languageCode?: string;

  @ApiPropertyOptional({ enum: SOURCE_TYPES, description: "Filter by word source: 'quicknote' | 'path' | 'manual'" })
  @IsOptional()
  @IsIn(SOURCE_TYPES)
  sourceType?: string;

  @ApiPropertyOptional({ enum: CEFR_LEVELS, description: 'Filter by CEFR level: A1–C2' })
  @IsOptional()
  @IsIn(CEFR_LEVELS)
  cefrLevel?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    default: 10,
    description: 'Max number of brand-new words (reviewCount = 0) to include per batch',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  newLimit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by UserPath ID — returns only words from that path (unlocked stages)' })
  @IsOptional()
  @IsString()
  userPathId?: string;
}
