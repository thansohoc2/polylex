import { Module } from '@nestjs/common';
import { PathsController } from './paths.controller';
import { PathsService } from './paths.service';
import { AiModule } from '../ai/ai.module';
import { VocabularyModule } from '../vocabulary/vocabulary.module';
import { YouTubeModule } from '../youtube/youtube.module';

@Module({
  imports: [AiModule, VocabularyModule, YouTubeModule],
  controllers: [PathsController],
  providers: [PathsService],
  exports: [PathsService],
})
export class PathsModule {}
