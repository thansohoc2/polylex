import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  Max,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CefrLevel } from '@polylex/shared-types';

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const PARTS_OF_SPEECH = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'other'];

export class CreateVocabularyDto {
  @ApiProperty({ example: 'apple' })
  @IsString()
  term: string;

  @ApiProperty({ example: 'en' })
  @IsString()
  languageCode: string;

  @ApiPropertyOptional({ enum: CEFR_LEVELS })
  @IsOptional()
  @IsIn(CEFR_LEVELS)
  cefrLevel?: CefrLevel;

  @ApiPropertyOptional({ enum: PARTS_OF_SPEECH })
  @IsOptional()
  @IsIn(PARTS_OF_SPEECH)
  partOfSpeech?: string;

  @ApiPropertyOptional({ example: '/ˈæpəl/' })
  @IsOptional()
  @IsString()
  phonetic?: string;

  @ApiPropertyOptional({ example: '花 (はな, hana)' })
  @IsOptional()
  @IsString()
  phoneticRomaji?: string;

  @ApiPropertyOptional({ example: 'I eat an apple every day.' })
  @IsOptional()
  @IsString()
  exampleSentence?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}

export class AddTranslationDto {
  @ApiProperty({ example: 'vi' })
  @IsString()
  targetLanguageCode: string;

  @ApiProperty({ example: 'táo' })
  @IsString()
  translation: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  definition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exampleTranslation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TtsPreviewDto {
  @ApiProperty({ example: 'apple' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  term: string;

  @ApiProperty({ example: 'en' })
  @IsString()
  languageCode: string;
}

export class VocabularyQueryDto {
  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  languageCode?: string;

  @ApiPropertyOptional({ enum: CEFR_LEVELS })
  @IsOptional()
  @IsIn(CEFR_LEVELS)
  cefrLevel?: CefrLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
