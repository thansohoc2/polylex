import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
import { TtsService } from './tts.service';
import { R2StorageService } from './r2-storage.service';
import { TtsAudioProcessor } from './tts-audio.processor';
import { SpeechToTextService } from './speech.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'tts' })],
  controllers: [VocabularyController],
  providers: [VocabularyService, TtsService, R2StorageService, TtsAudioProcessor, SpeechToTextService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
