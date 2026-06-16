import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VocabularyService } from './vocabulary.service';
import {
  CreateVocabularyDto,
  AddTranslationDto,
  VocabularyQueryDto,
  TtsPreviewDto,
} from './dto/vocabulary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('vocabulary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly svc: VocabularyService) {}

  @Get()
  @ApiOperation({ summary: 'List/search vocabulary (global + org)' })
  findAll(@Query() query: VocabularyQueryDto, @CurrentUser() user: AuthUser) {
    return this.svc.findAll(query, user.organizationId);
  }

  @Get('my-list')
  @ApiOperation({ summary: 'Get current user vocab list with SRS state' })
  getMyList(@CurrentUser() user: AuthUser, @Query('page') page: string, @Query('limit') limit: string) {
    return this.svc.getUserVocabulary(user.id, +page || 1, +limit || 20);
  }

  @Get(':id/audio')
  @ApiOperation({ summary: 'Get or generate TTS audio URL for vocabulary' })
  getAudio(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.svc.getAudioUrl(id, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single vocabulary entry' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new vocabulary entry' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateVocabularyDto, @CurrentUser() user: AuthUser) {
    return this.svc.create(dto, user.organizationId);
  }

  @Post('tts-preview')
  @ApiOperation({ summary: 'Preview TTS audio realtime (no cache)' })
  @HttpCode(HttpStatus.OK)
  async ttsPreview(
    @Body() dto: TtsPreviewDto,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buffer = await this.svc.previewTts(dto.term, dto.languageCode, user.id);
    res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': String(buffer.length) });
    res.send(buffer);
  }

  @Post(':id/translations')
  @ApiOperation({ summary: 'Add/update a translation for a vocabulary entry' })
  @HttpCode(HttpStatus.CREATED)
  addTranslation(@Param('id') id: string, @Body() dto: AddTranslationDto) {
    return this.svc.addTranslation(id, dto);
  }

  @Post(':id/add-to-my-list')
  @ApiOperation({ summary: 'Add a vocabulary word to user\'s learning list' })
  @HttpCode(HttpStatus.CREATED)
  addToMyList(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.svc.addToUserVocabulary(user.id, id, 'manual');
  }
}
