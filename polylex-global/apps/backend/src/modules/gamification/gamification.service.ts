import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationStats } from '@polylex/shared-types';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';

const BADGES = {
  FIRST_REVIEW: 'Complete your first review',
  STREAK_3: '3-day streak',
  STREAK_7: '7-day streak',
  STREAK_30: '30-day streak',
  WORDS_10: 'Learn 10 words',
  WORDS_50: 'Learn 50 words',
  WORDS_100: 'Learn 100 words',
  WORDS_500: 'Learn 500 words',
  PERFECT_DAY: 'Get 5 reviews in a row correct',
  PERFECT_SESSION: 'Perfect recent session',
  NIGHT_OWL: 'Study after midnight',
  EARLY_BIRD: 'Study before 8 AM',
  WEEKEND_WARRIOR: 'Study on weekends',
  LEVEL_10: 'Reach level 10',
};

const LEVEL_XP_BASE = 100;

export function calculateLevelFromXp(totalXp: number) {
  const safeXp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let remaining = safeXp;
  let xpForLevel = LEVEL_XP_BASE;

  while (remaining >= xpForLevel) {
    remaining -= xpForLevel;
    level += 1;
    xpForLevel += 50;
  }

  return {
    level,
    xpInLevel: remaining,
    xpForNextLevel: xpForLevel,
  };
}

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string): Promise<GamificationStats> {
    const [user, streak, badges, totalWords, masteredWords] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true, dailyGoal: true },
      }),
      this.prisma.userStreak.findUnique({ where: { userId } }),
      this.prisma.userBadge.findMany({ where: { userId }, orderBy: { earnedAt: 'desc' } }),
      this.prisma.userVocabulary.count({ where: { userId } }),
      this.prisma.userVocabulary.count({ where: { userId, memoryStrength: { gt: 0.8 } } }),
    ]);

    const timezone = user?.timezone ?? 'UTC';
    const dailyGoal = user?.dailyGoal ?? 10;

    const nowUtc = new Date();
    const nowLocal = toZonedTime(nowUtc, timezone);
    const startLocal = startOfDay(nowLocal);
    const endLocal = endOfDay(nowLocal);
    const todayStartUtc = fromZonedTime(startLocal, timezone);
    const todayEndUtc = fromZonedTime(endLocal, timezone);

    const todayReviewAgg = await this.prisma.reviewHistory.aggregate({
      where: {
        userId,
        reviewedAt: {
          gte: todayStartUtc,
          lte: todayEndUtc,
        },
      },
      _sum: { recallQuality: true },
    });

    const dailyXp = (todayReviewAgg._sum.recallQuality ?? 0) * 2;
    const dailyProgressPercent = Math.min(100, Math.round((dailyXp / Math.max(1, dailyGoal)) * 100));
    const totalXp = streak?.totalXp ?? 0;
    const levelProgress = calculateLevelFromXp(totalXp);

    return {
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      streakFreezes: streak?.streakFreezes ?? 0,
      totalXp,
      weeklyXp: streak?.weeklyXp ?? 0,
      level: levelProgress.level,
      xpInLevel: levelProgress.xpInLevel,
      xpForNextLevel: levelProgress.xpForNextLevel,
      dailyXp,
      dailyGoal,
      dailyProgressPercent,
      isDailyGoalReached: dailyXp >= dailyGoal,
      totalWordCount: totalWords,
      masteredWordCount: masteredWords,
      badges: badges.map((b) => ({
        badge: b.badge,
        description: BADGES[b.badge as keyof typeof BADGES] ?? b.badge,
        earnedAt: b.earnedAt.toISOString(),
      })),
    };
  }

  async getLeaderboard(userId: string, limit = 20) {
    const safeLimit = Math.min(100, Math.max(1, limit));

    const [topRows, meStreak] = await Promise.all([
      this.prisma.userStreak.findMany({
        take: safeLimit,
        orderBy: [{ weeklyXp: 'desc' }, { userId: 'asc' }],
        select: {
          userId: true,
          weeklyXp: true,
          user: { select: { displayName: true } },
        },
      }),
      this.prisma.userStreak.findUnique({
        where: { userId },
        select: {
          userId: true,
          weeklyXp: true,
          user: { select: { displayName: true } },
        },
      }),
    ]);

    const items = topRows.map((row, index) => ({
      rank: index + 1,
      displayName: row.user.displayName,
      weeklyXp: row.weeklyXp,
      isMe: row.userId === userId,
    }));

    let me = items.find((entry) => entry.isMe) ?? null;

    if (!me && meStreak) {
      const usersAbove = await this.prisma.userStreak.count({
        where: {
          OR: [
            { weeklyXp: { gt: meStreak.weeklyXp } },
            {
              AND: [
                { weeklyXp: meStreak.weeklyXp },
                { userId: { lt: meStreak.userId } },
              ],
            },
          ],
        },
      });

      me = {
        rank: usersAbove + 1,
        displayName: meStreak.user.displayName,
        weeklyXp: meStreak.weeklyXp,
        isMe: true,
      };
    }

    return {
      items,
      me,
      resetAt: this.getNextWeeklyResetUtc().toISOString(),
    };
  }

  /** Check and award badges after a review session */
  async checkAndAwardBadges(userId: string) {
    const [streak, totalWords, user] = await Promise.all([
      this.prisma.userStreak.findUnique({ where: { userId } }),
      this.prisma.userVocabulary.count({ where: { userId } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
    ]);
    const existingBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      select: { badge: true },
    });
    const hasBadge = (b: string) => existingBadges.some((eb) => eb.badge === b);

    const toAward: string[] = [];

    const reviewCount = await this.prisma.reviewHistory.count({ where: { userId } });
    if (reviewCount >= 1 && !hasBadge('FIRST_REVIEW')) toAward.push('FIRST_REVIEW');

    if ((streak?.currentStreak ?? 0) >= 3 && !hasBadge('STREAK_3')) toAward.push('STREAK_3');
    if ((streak?.currentStreak ?? 0) >= 7 && !hasBadge('STREAK_7')) toAward.push('STREAK_7');
    if ((streak?.currentStreak ?? 0) >= 30 && !hasBadge('STREAK_30')) toAward.push('STREAK_30');

    if (totalWords >= 10 && !hasBadge('WORDS_10')) toAward.push('WORDS_10');
    if (totalWords >= 50 && !hasBadge('WORDS_50')) toAward.push('WORDS_50');
    if (totalWords >= 100 && !hasBadge('WORDS_100')) toAward.push('WORDS_100');
    if (totalWords >= 500 && !hasBadge('WORDS_500')) toAward.push('WORDS_500');

    const recentReviews = await this.prisma.reviewHistory.findMany({
      where: { userId },
      orderBy: { reviewedAt: 'desc' },
      take: 5,
      select: { recallQuality: true },
    });
    const isPerfectRecentSession =
      recentReviews.length >= 5 && recentReviews.every((r) => r.recallQuality >= 4);
    if (isPerfectRecentSession && !hasBadge('PERFECT_SESSION')) toAward.push('PERFECT_SESSION');

    const timezone = user?.timezone ?? 'UTC';
    const nowLocal = toZonedTime(new Date(), timezone);
    const hour = nowLocal.getHours();
    const day = nowLocal.getDay();
    if (hour < 5 && !hasBadge('NIGHT_OWL')) toAward.push('NIGHT_OWL');
    if (hour >= 5 && hour < 8 && !hasBadge('EARLY_BIRD')) toAward.push('EARLY_BIRD');
    if ((day === 0 || day === 6) && !hasBadge('WEEKEND_WARRIOR')) toAward.push('WEEKEND_WARRIOR');

    const level = calculateLevelFromXp(streak?.totalXp ?? 0).level;
    if (level >= 10 && !hasBadge('LEVEL_10')) toAward.push('LEVEL_10');

    if (toAward.length > 0) {
      await this.prisma.userBadge.createMany({
        data: toAward.map((badge) => ({ userId, badge })),
        skipDuplicates: true,
      });
    }

    return toAward;
  }

  /** Cron: Reset weeklyXp every Monday at midnight UTC */
  async resetWeeklyXp() {
    await this.prisma.userStreak.updateMany({ data: { weeklyXp: 0 } });
  }

  private getNextWeeklyResetUtc(now = new Date()): Date {
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = next.getUTCDay(); // 0 = Sunday, 1 = Monday
    let daysUntilMonday = (8 - day) % 7;
    if (daysUntilMonday === 0) {
      daysUntilMonday = 7;
    }
    next.setUTCDate(next.getUTCDate() + daysUntilMonday);
    return next;
  }
}
