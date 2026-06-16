import { IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuickNoteStatus } from '@prisma/client';

export class CreateQuickNoteDto {
  @ApiProperty({ example: 'serendipity', description: 'Word or phrase to enrich' })
  @IsString()
  @Length(1, 200)
  term: string;

  @ApiProperty({ example: 'en', description: 'Language code of the term' })
  @IsString()
  @Length(2, 10)
  sourceLanguageCode: string;

  @ApiProperty({ example: 'vi', description: 'Language code for translation' })
  @IsString()
  @Length(2, 10)
  targetLanguageCode: string;
}

export class QuickNoteQueryDto {
  @ApiProperty({ required: false, description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: QuickNoteStatus;
}

export class QuickNoteResponseDto {
  id: string;
  term: string;
  sourceLanguageCode: string;
  targetLanguageCode: string;
  status: QuickNoteStatus;
  errorMessage: string | null;
  vocabularyBaseId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
