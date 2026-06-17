import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { TtsService } from './tts.service';
import { R2StorageService } from './r2-storage.service';

export interface TtsGenerateJob {
  vocabularyBaseId: string;
  term: string;
  languageCode: string;
}

@Processor('tts')
export class TtsAudioProcessor {
  private readonly logger = new Logger(TtsAudioProcessor.name);

  constructor(
    private readonly ttsService: TtsService,
    private readonly r2Storage: R2StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('tts-generate')
  async handleGenerate(job: Job<TtsGenerateJob>): Promise<void> {
    const { vocabularyBaseId, term, languageCode } = job.data;
    this.logger.log(
      `Processing TTS job #${job.id}: term="${term}" lang=${languageCode} vocabId=${vocabularyBaseId} attempt=${job.attemptsMade + 1}`,
    );

    // Deduplication: recheck before calling TTS
    const vocab = await this.prisma.vocabularyBase.findUnique({
      where: { id: vocabularyBaseId },
    });
    if (!vocab) {
      this.logger.warn(`TTS job #${job.id}: vocab ${vocabularyBaseId} not found, skipping`);
      return;
    }
    if (vocab.audioUrl) {
      this.logger.log(`TTS job #${job.id}: vocab ${vocabularyBaseId} already has audio, skipping`);
      return;
    }

    try {
      const mp3 = await this.ttsService.synthesize(term, languageCode, 'FEMALE');
      this.logger.debug(`TTS job #${job.id}: synthesized ${mp3.byteLength} bytes, uploading to R2...`);
      const key = `tts/${vocabularyBaseId}.mp3`;
      const url = await this.r2Storage.upload(key, mp3);
      await this.prisma.vocabularyBase.update({
        where: { id: vocabularyBaseId },
        data: { audioUrl: url },
      });
      this.logger.log(`TTS job #${job.id}: done — ${url}`);
    } catch (err) {
      const e = err as Error & { code?: string };
      this.logger.error(
        `TTS job #${job.id} FAILED: term="${term}" lang=${languageCode} | ` +
        `errorName=${e.name} | code=${e.code ?? 'n/a'} | message=${e.message}`,
        e.stack,
      );
      throw err; // re-throw so Bull retries
    }
  }
}
