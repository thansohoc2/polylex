import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GamificationService } from './gamification.service';

@Injectable()
export class GamificationScheduler {
  constructor(private readonly gamificationService: GamificationService) {}

  /** Reset weekly XP every Monday at 00:00 UTC */
  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyReset() {
    await this.gamificationService.resetWeeklyXp();
    console.log('[Cron] Weekly XP reset completed');
  }
}
