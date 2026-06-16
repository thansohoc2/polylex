import {
  Injectable,
  ConflictException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResponse } from '@polylex/shared-types';
import {
  CreateVocabularyDto,
  AddTranslationDto,
  VocabularyQueryDto,
} from './dto/vocabulary.dto';
import { TtsService } from './tts.service';
import { R2StorageService } from './r2-storage.service';
import { TtsGenerateJob } from './tts-audio.processor';

export interface BulkVocabItem {
  term: string;
  phonetic?: string | null;
  phoneticRomaji?: string | null;
  cefrLevel?: string | null;
  partOfSpeech?: string | null;
  exampleSentence?: string | null;
  translation: string;
}

@Injectable()
export class VocabularyService {
  private readonly logger = new Logger(VocabularyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ttsService: TtsService,
    private readonly r2Storage: R2StorageService,
    @InjectQueue('tts') private readonly ttsQueue: Queue,
  ) {}

  async create(dto: CreateVocabularyDto, orgId: string | null) {
    const language = await this.prisma.language.findUniqueOrThrow({
      where: { code: dto.languageCode },
    });

    let result: Awaited<ReturnType<typeof this.prisma.vocabularyBase.create>>;
    try {
      result = await this.prisma.vocabularyBase.create({
        data: {
          term: dto.term,
          languageId: language.id,
          cefrLevel: dto.cefrLevel,
          partOfSpeech: dto.partOfSpeech,
          phonetic: dto.phonetic,
          phoneticRomaji: dto.phoneticRomaji,
          exampleSentence: dto.exampleSentence,
          imageUrl: dto.imageUrl,
          organizationId: orgId,
        },
        include: { language: true, translations: true },
      });
    } catch {
      throw new ConflictException('Term already exists for this language');
    }

    if (!result.audioUrl && this.ttsService.isEnabled) {
      try {
        await this.ttsQueue.add('tts-generate', {
          vocabularyBaseId: result.id,
          term: result.term,
          languageCode: language.code,
        } satisfies TtsGenerateJob);
      } catch (e) {
        this.logger.warn(`Failed to dispatch TTS job for ${result.id}`, e);
      }
    }

    return result;
  }

  async addTranslation(vocabId: string, dto: AddTranslationDto) {
    await this.prisma.vocabularyBase.findUniqueOrThrow({ where: { id: vocabId } });
    const targetLang = await this.prisma.language.findUniqueOrThrow({
      where: { code: dto.targetLanguageCode },
    });

    return this.prisma.vocabularyTranslation.upsert({
      where: {
        vocabularyBaseId_targetLanguageId: {
          vocabularyBaseId: vocabId,
          targetLanguageId: targetLang.id,
        },
      },
      create: {
        vocabularyBaseId: vocabId,
        targetLanguageId: targetLang.id,
        translation: dto.translation,
        definition: dto.definition,
        exampleTranslation: dto.exampleTranslation,
        notes: dto.notes,
      },
      update: {
        translation: dto.translation,
        definition: dto.definition,
        exampleTranslation: dto.exampleTranslation,
        notes: dto.notes,
      },
    });
  }

  async findAll(
    query: VocabularyQueryDto,
    orgId: string | null,
  ): Promise<PaginatedResponse<unknown>> {
    const { page = 1, limit = 20, languageCode, cefrLevel, search } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      OR: [{ organizationId: orgId }, { organizationId: null }],
    };

    if (languageCode) {
      const lang = await this.prisma.language.findUnique({ where: { code: languageCode } });
      if (lang) where['languageId'] = lang.id;
    }
    if (cefrLevel) where['cefrLevel'] = cefrLevel;
    if (search) where['term'] = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.vocabularyBase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { term: 'asc' },
        include: { language: true, translations: { include: { targetLanguage: true } } },
      }),
      this.prisma.vocabularyBase.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return this.prisma.vocabularyBase.findUniqueOrThrow({
      where: { id },
      include: { language: true, translations: { include: { targetLanguage: true } } },
    });
  }

  async getAudioUrl(
    vocabId: string,
    userId: string,
  ): Promise<{ audioUrl: string | null; reason?: string }> {
    const vocab = await this.prisma.vocabularyBase.findUniqueOrThrow({
      where: { id: vocabId },
      include: { language: true },
    });

    // Cache hit
    if (vocab.audioUrl) return { audioUrl: vocab.audioUrl };

    // TTS disabled
    if (!this.ttsService.isEnabled) return { audioUrl: null, reason: 'tts_disabled' };

    // Get user voice preference
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { ttsVoiceGender: true },
    });
    const gender = (user.ttsVoiceGender as 'MALE' | 'FEMALE') ?? 'FEMALE';

    // Generate TTS + upload R2
    const mp3 = await this.ttsService.synthesize(vocab.term, vocab.language.code, gender);
    const key = `tts/${vocabId}.mp3`;
    const url = await this.r2Storage.upload(key, mp3);

    // Save to DB
    await this.prisma.vocabularyBase.update({
      where: { id: vocabId },
      data: { audioUrl: url },
    });

    return { audioUrl: url };
  }

  async previewTts(term: string, langCode: string, userId: string): Promise<Buffer> {
    if (!this.ttsService.isEnabled) {
      throw new ServiceUnavailableException('TTS is disabled');
    }
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { ttsVoiceGender: true },
    });
    const gender = (user.ttsVoiceGender as 'MALE' | 'FEMALE') ?? 'FEMALE';
    return this.ttsService.synthesize(term, langCode, gender);
  }

  async addToUserVocabulary(userId: string, vocabularyBaseId: string, sourceType?: string) {
    await this.prisma.vocabularyBase.findUniqueOrThrow({ where: { id: vocabularyBaseId } });

    return this.prisma.userVocabulary.upsert({
      where: { userId_vocabularyBaseId: { userId, vocabularyBaseId } },
      create: { userId, vocabularyBaseId, ...(sourceType ? { sourceType } : {}) },
      update: { isSuspended: false }, // preserve original sourceType on re-add
    });
  }

  async getUserVocabulary(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.userVocabulary.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { addedAt: 'desc' },
        include: {
          vocabularyBase: {
            include: { language: true, translations: true },
          },
        },
      }),
      this.prisma.userVocabulary.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async upsertBulk(
    items: BulkVocabItem[],
    languageId: string,
    nativeLanguageId: string,
  ): Promise<{ id: string; term: string }[]> {
    const results: { id: string; term: string }[] = [];

    // Fetch language code once outside the loop to avoid N+1
    const language = await this.prisma.language.findUniqueOrThrow({
      where: { id: languageId },
      select: { code: true },
    });

    for (const item of items) {
      // Prisma does not support null in compound unique where clause,
      // so we use findFirst + create/update instead of upsert.
      const existing = await this.prisma.vocabularyBase.findFirst({
        where: { term: item.term, languageId, organizationId: null },
        select: { id: true, term: true, audioUrl: true },
      });

      let vocab: { id: string; term: string };
      const existingAudioUrl = existing?.audioUrl ?? null;

      if (existing) {
        vocab = await this.prisma.vocabularyBase.update({
          where: { id: existing.id },
          data: {
            ...(item.phonetic ? { phonetic: item.phonetic } : {}),
            ...(item.phoneticRomaji ? { phoneticRomaji: item.phoneticRomaji } : {}),
            ...(item.cefrLevel ? { cefrLevel: item.cefrLevel } : {}),
            ...(item.partOfSpeech ? { partOfSpeech: item.partOfSpeech } : {}),
            ...(item.exampleSentence ? { exampleSentence: item.exampleSentence } : {}),
          },
          select: { id: true, term: true },
        });
      } else {
        vocab = await this.prisma.vocabularyBase.create({
          data: {
            term: item.term,
            languageId,
            organizationId: null,
            phonetic: item.phonetic ?? null,
            phoneticRomaji: item.phoneticRomaji ?? null,
            cefrLevel: item.cefrLevel ?? null,
            partOfSpeech: item.partOfSpeech ?? null,
            exampleSentence: item.exampleSentence ?? null,
          },
          select: { id: true, term: true },
        });
      }

      await this.prisma.vocabularyTranslation.upsert({
        where: {
          vocabularyBaseId_targetLanguageId: {
            vocabularyBaseId: vocab.id,
            targetLanguageId: nativeLanguageId,
          },
        },
        create: {
          vocabularyBaseId: vocab.id,
          targetLanguageId: nativeLanguageId,
          translation: item.translation,
        },
        update: {
          translation: item.translation,
        },
      });

      // Dispatch TTS job if no existing audio
      if (!existingAudioUrl && this.ttsService.isEnabled) {
        try {
          await this.ttsQueue.add('tts-generate', {
            vocabularyBaseId: vocab.id,
            term: vocab.term,
            languageCode: language.code,
          } satisfies TtsGenerateJob);
        } catch (e) {
          this.logger.warn(`Failed to dispatch TTS job for ${vocab.id}`, e);
        }
      }

      results.push({ id: vocab.id, term: vocab.term });
    }

    return results;
  }
}
