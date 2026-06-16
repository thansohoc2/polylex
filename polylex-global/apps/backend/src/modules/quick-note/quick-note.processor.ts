import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QuickNoteStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { VocabularyService } from '../vocabulary/vocabulary.service';
import { QUICK_NOTE_QUEUE, ENRICH_JOB } from './quick-note.service';

interface EnrichJobData {
  quickNoteId: string;
}

@Processor(QUICK_NOTE_QUEUE)
export class QuickNoteProcessor {
  private readonly logger = new Logger(QuickNoteProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly vocabularyService: VocabularyService,
  ) {}

  @Process(ENRICH_JOB)
  async handleEnrich(job: Job<EnrichJobData>): Promise<void> {
    const { quickNoteId } = job.data;
    this.logger.log(`Processing quick note ${quickNoteId}`);

    const note = await this.prisma.quickNote.findUniqueOrThrow({ where: { id: quickNoteId } });

    // Mark as processing
    await this.prisma.quickNote.update({
      where: { id: quickNoteId },
      data: { status: QuickNoteStatus.PROCESSING },
    });

    try {
      // Call Gemini to enrich
      const enriched = await this.aiService.enrichWord(
        note.term,
        note.sourceLanguageCode,
        note.targetLanguageCode,
      );

      // Try to create a VocabularyBase entry (catch conflict = already exists)
      let vocabBaseId: string;

      try {
        const vocab = await this.vocabularyService.create(
          {
            term: note.term,
            languageCode: note.sourceLanguageCode,
            cefrLevel: enriched.cefrLevel as any,
            partOfSpeech: enriched.partOfSpeech ?? undefined,
            phonetic: enriched.phonetic ?? undefined,
            phoneticRomaji: enriched.phoneticRomaji ?? undefined,
            exampleSentence: enriched.exampleSentence ?? undefined,
          },
          null,
        );
        vocabBaseId = vocab.id;
      } catch {
        // Term already exists — find the existing one
        const language = await this.prisma.language.findUnique({
          where: { code: note.sourceLanguageCode },
        });
        const existing = await this.prisma.vocabularyBase.findFirstOrThrow({
          where: { term: note.term, languageId: language?.id },
        });
        vocabBaseId = existing.id;
      }

      // Upsert translation
      await this.vocabularyService.addTranslation(vocabBaseId, {
        targetLanguageCode: note.targetLanguageCode,
        translation: enriched.translationText,
      });

      // Add to user's learning list (mark as coming from quick-note)
      await this.vocabularyService.addToUserVocabulary(note.userId, vocabBaseId, 'quicknote');

      // Mark DONE
      await this.prisma.quickNote.update({
        where: { id: quickNoteId },
        data: { status: QuickNoteStatus.DONE, vocabularyBaseId: vocabBaseId },
      });

      this.logger.log(`Quick note ${quickNoteId} processed successfully → vocab ${vocabBaseId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Quick note ${quickNoteId} failed: ${message}`);

      await this.prisma.quickNote.update({
        where: { id: quickNoteId },
        data: { status: QuickNoteStatus.ERROR, errorMessage: message },
      });

      // Re-throw so Bull retries
      throw err;
    }
  }
}
