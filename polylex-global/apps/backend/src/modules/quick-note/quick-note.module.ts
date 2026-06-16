import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QuickNoteController } from './quick-note.controller';
import { QuickNoteService, QUICK_NOTE_QUEUE } from './quick-note.service';
import { QuickNoteProcessor } from './quick-note.processor';
import { AiModule } from '../ai/ai.module';
import { VocabularyModule } from '../vocabulary/vocabulary.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUICK_NOTE_QUEUE }),
    AiModule,
    VocabularyModule,
  ],
  controllers: [QuickNoteController],
  providers: [QuickNoteService, QuickNoteProcessor],
})
export class QuickNoteModule {}
