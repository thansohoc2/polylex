import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HeatmapEntry, VelocityEntry, RetentionRateDto } from '@polylex/shared-types';
import { toZonedTime } from 'date-fns-tz';
import { format, subDays } from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHeatmap(userId: string, days: number = 90): Promise<HeatmapEntry[]> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });

    const since = subDays(new Date(), days);

    const history = await this.prisma.reviewHistory.findMany({
      where: { userId, reviewedAt: { gte: since } },
      select: { reviewedAt: true },
    });

    const counts: Record<string, number> = {};
    for (const h of history) {
      const day = format(toZonedTime(h.reviewedAt, user.timezone), 'yyyy-MM-dd');
      counts[day] = (counts[day] ?? 0) + 1;
    }

    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }

  async getLearningVelocity(userId: string, weeks: number = 8): Promise<VelocityEntry[]> {
    const since = subDays(new Date(), weeks * 7);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });

    const history = await this.prisma.reviewHistory.findMany({
      where: { userId, reviewedAt: { gte: since }, recallQuality: { gte: 3 } },
      select: { reviewedAt: true, vocabularyBaseId: true },
    });

    const weekBuckets: Record<string, Set<string>> = {};
    for (const h of history) {
      const local = toZonedTime(h.reviewedAt, user.timezone);
      const weekLabel = format(local, 'yyyy-ww');
      if (!weekBuckets[weekLabel]) weekBuckets[weekLabel] = new Set();
      weekBuckets[weekLabel].add(h.vocabularyBaseId);
    }

    return Object.entries(weekBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, vocab]) => ({ week, wordsLearned: vocab.size }));
  }

  async getRetentionRate(userId: string): Promise<RetentionRateDto> {
    const last30Days = subDays(new Date(), 30);

    const [total, passed] = await Promise.all([
      this.prisma.reviewHistory.count({ where: { userId, reviewedAt: { gte: last30Days } } }),
      this.prisma.reviewHistory.count({
        where: { userId, reviewedAt: { gte: last30Days }, recallQuality: { gte: 3 } },
      }),
    ]);

    const rate = total > 0 ? (passed / total) * 100 : 0;
    return { total, passed, retentionPercent: Math.round(rate * 10) / 10 };
  }
}
