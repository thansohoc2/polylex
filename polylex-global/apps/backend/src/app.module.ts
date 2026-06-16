import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LanguagesModule } from './modules/languages/languages.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';
import { ReviewModule } from './modules/review/review.module';
import { RoadmapModule } from './modules/roadmap/roadmap.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { AiModule } from './modules/ai/ai.module';
import { QuickNoteModule } from './modules/quick-note/quick-note.module';
import { PathsModule } from './modules/paths/paths.module';
import { HealthModule } from './modules/health/health.module';
import { UpdatesModule } from './modules/updates/updates.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('REDIS_URL'),
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    LanguagesModule,
    VocabularyModule,
    ReviewModule,
    RoadmapModule,
    AnalyticsModule,
    GamificationModule,
    AiModule,
    QuickNoteModule,
    PathsModule,
    HealthModule,
    UpdatesModule,
  ],
})
export class AppModule {}
