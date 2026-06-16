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

    // Deduplication: recheck before calling TTS
    const vocab = await this.prisma.vocabularyBase.findUnique({
      where: { id: vocabularyBaseId },
    });
    if (!vocab || vocab.audioUrl) return; // already has audio or was deleted

    try {
      const mp3 = await this.ttsService.synthesize(term, languageCode, 'FEMALE');
      const key = `tts/${vocabularyBaseId}.mp3`;
      const url = await this.r2Storage.upload(key, mp3);
      await this.prisma.vocabularyBase.update({
        where: { id: vocabularyBaseId },
        data: { audioUrl: url },
      });
      this.logger.log(`TTS generated for vocab ${vocabularyBaseId}`);
    } catch (err) {
      this.logger.error(`TTS generation failed for ${vocabularyBaseId}`, err);
      throw err; // re-throw so Bull retries
    }
  }
}
