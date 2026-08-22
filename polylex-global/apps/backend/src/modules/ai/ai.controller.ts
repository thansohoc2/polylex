import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService, AiHintDto } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ContextSentenceDto {
  @ApiProperty() @IsString() term: string;
  @ApiProperty() @IsString() languageCode: string;
  @ApiProperty() @IsString() cefrLevel: string;
}

class WordAnalysisDto {
  @ApiProperty() @IsString() term: string;
  @ApiProperty() @IsString() languageCode: string;
  @ApiProperty() @IsString() nativeLanguageCode: string;
  @ApiProperty({ required: false }) @IsString() cefrLevel?: string;
  @ApiProperty({ required: false }) @IsString() partOfSpeech?: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly svc: AiService) {}

  @Post('context-sentence')
  @ApiOperation({ summary: 'Generate AI context sentence (OPENAI_ENABLED=true required)' })
  generateContextSentence(@Body() dto: ContextSentenceDto) {
    return this.svc.generateContextSentence(dto.term, dto.languageCode, dto.cefrLevel);
  }

  @Post('memory-hint')
  @ApiOperation({ summary: 'Generate AI memory/mnemonic hint' })
  generateMemoryHint(@Body() dto: AiHintDto) {
    return this.svc.generateMemoryHint(dto.term, dto.termLanguageCode, dto.userNativeLanguageCode);
  }

  @Post('word-analysis')
  @ApiOperation({ summary: 'Generate a structured AI analysis for a word or phrase' })
  generateWordAnalysis(@Body() dto: WordAnalysisDto) {
    return this.svc.generateWordAnalysis(
      dto.term,
      dto.languageCode,
      dto.nativeLanguageCode,
      dto.cefrLevel,
      dto.partOfSpeech,
    );
  }
}
