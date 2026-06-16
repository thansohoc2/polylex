import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { calculateAcre } from './acre/acre.engine';
import { SubmitReviewDto, ReviewQueueQueryDto } from './dto/review.dto';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';

const DEFAULT_NEW_WORDS_LIMIT = 10;
const MAX_STREAK_FREEZES = 2;

const REVIEW_INCLUDE = {
  vocabularyBase: {
    include: {
      language: true,
      translations: { include: { targetLanguage: true } },
    },
  },
} satisfies Prisma.UserVocabularyInclude;

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
  ) {}

  /**
   * Get today's review queue for a user (due cards).
   * Uses user's timezone so "today" is timezone-aware.
   */
  async getQueue(userId: string, query: ReviewQueueQueryDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });

    // "Now" in user's timezone
    const nowUtc = new Date();
    const nowLocal = toZonedTime(nowUtc, user.timezone);
    const todayEndLocal = endOfDay(nowLocal);
    const todayEndUtc = fromZonedTime(todayEndLocal, user.timezone);

    const where: Record<string, unknown> = {
      userId,
      isSuspended: false,
      nextReview: { lte: todayEndUtc },
    };

    const vocabBaseFilter: Record<string, unknown> = {};

    if (query.languageCode) {
      const lang = await this.prisma.language.findUnique({
        where: { code: query.languageCode },
      });
      if (lang) vocabBaseFilter['languageId'] = lang.id;
    }

    if (query.cefrLevel) {
      vocabBaseFilter['cefrLevel'] = query.cefrLevel;
    }

    if (Object.keys(vocabBaseFilter).length > 0) {
      where['vocabularyBase'] = vocabBaseFilter;
    }

    if (query.sourceType) {
      where['sourceType'] = query.sourceType;
    }

    let pathTitle: string | undefined;
    let currentPathStageId: string | undefined;

    if (query.userPathId) {
      const userPath = await this.prisma.userPath.findFirst({
        where: { id: query.userPathId, userId },
        include: {
          pathTemplate: { select: { title: true } },
          userStages: {
            where: { isUnlocked: true, isCompleted: false },
            include: {
              pathStage: {
                include: { stageVocabs: { select: { vocabularyBaseId: true } } },
              },
            },
          },
        },
      });
      if (userPath) {
        pathTitle = userPath.pathTemplate.title;
        const vocabIds = userPath.userStages.flatMap((us) =>
          us.pathStage.stageVocabs.map((sv) => sv.vocabularyBaseId),
        );
        where['vocabularyBaseId'] = { in: vocabIds };
        // Path mode: show unlearned words regardless of SRS schedule
        where['nextReview'] = undefined;
        where['OR'] = [
          { nextReview: { lte: todayEndUtc } },
          { isLearned: false },
        ];
        // Identify the current active stage for dialogue navigation
        const currentStage = userPath.userStages[0];
        currentPathStageId = currentStage?.pathStage.id;
      }
    }

    const limit = query.limit ?? 20;

    let items;
    if (query.userPathId) {
      // Path mode keeps the original single query (its OR/unlearned logic must
      // not be split into due/new buckets).
      items = await this.prisma.userVocabulary.findMany({
        where,
        take: limit,
        orderBy: [{ isLeech: 'desc' }, { nextReview: 'asc' }],
        include: REVIEW_INCLUDE,
      });
    } else {
      // Prioritise due reviews, then top up with a capped number of brand-new
      // words so the learner is never flooded with unfamiliar terms at once.
      const newLimit = query.newLimit ?? DEFAULT_NEW_WORDS_LIMIT;

      const dueItems = await this.prisma.userVocabulary.findMany({
        where: { ...where, reviewCount: { gt: 0 } },
        take: limit,
        orderBy: [{ isLeech: 'desc' }, { nextReview: 'asc' }],
        include: REVIEW_INCLUDE,
      });

      const remainingCapacity = Math.max(0, limit - dueItems.length);
      const newTake = Math.min(newLimit, remainingCapacity);

      const newItems =
        newTake > 0
          ? await this.prisma.userVocabulary.findMany({
              where: { ...where, reviewCount: 0 },
              take: newTake,
              orderBy: [{ addedAt: 'asc' }],
              include: REVIEW_INCLUDE,
            })
          : [];

      items = [...dueItems, ...newItems];
    }

    // Safety net: if the path queue is empty but the stage is still active,
    // check if all stage vocab are now learned and auto-complete.
    if (items.length === 0 && currentPathStageId) {
      const currentUps = await this.prisma.userPathStage.findFirst({
        where: {
          pathStage: { id: currentPathStageId },
          isUnlocked: true,
          isCompleted: false,
          userPath: { userId },
        },
        include: {
          pathStage: {
            include: { stageVocabs: { select: { vocabularyBaseId: true } } },
          },
        },
      });
      if (currentUps) {
        const stageVocabIds = currentUps.pathStage.stageVocabs.map((sv) => sv.vocabularyBaseId);
        const learnedCount = await this.prisma.userVocabulary.count({
          where: { userId, vocabularyBaseId: { in: stageVocabIds }, isLearned: true },
        });
        if (learnedCount >= currentUps.pathStage.wordCount) {
          await this._autoCompleteStage(userId, currentUps.id);
        }
      }
    }

    return { items, pathTitle, currentPathStageId };
  }

  /**
   * Submit a review result, run ACRE, persist new state & history.
   */
  async submitReview(userId: string, dto: SubmitReviewDto) {
    const uv = await this.prisma.userVocabulary.findFirst({
      where: { id: dto.userVocabularyId, userId },
    });

    if (!uv) {
      throw new NotFoundException('UserVocabulary not found');
    }

    // Run ACRE algorithm (pure function — no side effects)
    const acreResult = calculateAcre({
      recallQuality: dto.recallQuality,
      responseTimeMs: dto.responseTimeMs,
      confidenceLevel: dto.confidenceLevel,
      memoryStrength: uv.memoryStrength,
      leechScore: uv.leechScore,
      difficultyUser: uv.difficultyUser,
      reviewMode: dto.reviewMode,
      reviewCount: uv.reviewCount,
      currentIntervalDays: uv.intervalDays,
    });

    // Update UserVocabulary state
    const updated = await this.prisma.userVocabulary.update({
      where: { id: uv.id },
      data: {
        memoryStrength: acreResult.newMemoryStrength,
        intervalDays: acreResult.intervalDays,
        nextReview: acreResult.nextReview,
        leechScore: acreResult.newLeechScore,
        isLeech: acreResult.isLeech,
        reviewCount: { increment: 1 },
        lastReviewedAt: new Date(),
        ...(dto.recallQuality >= 1 && { isLearned: true }),
        // Update difficulty: if recall was poor, slightly increase difficulty
        difficultyUser: Math.min(
          1.0,
          Math.max(0.0, uv.difficultyUser + (dto.recallQuality < 3 ? 0.02 : -0.01)),
        ),
      },
    });

    // Write review history
    await this.prisma.reviewHistory.create({
      data: {
        userId,
        vocabularyBaseId: uv.vocabularyBaseId,
        reviewMode: dto.reviewMode,
        recallQuality: dto.recallQuality,
        responseTimeMs: dto.responseTimeMs,
        confidenceLevel: dto.confidenceLevel,
        memoryStrengthBefore: uv.memoryStrength,
        memoryStrengthAfter: acreResult.newMemoryStrength,
        intervalDays: acreResult.intervalDays,
        isLeech: acreResult.isLeech,
      },
    });

    // Update wordsLearned for path stages containing this word (first time learned)
    if (!uv.isLearned && dto.recallQuality >= 1) {
      await this._updateWordsLearned(userId, uv.vocabularyBaseId);
    }

    // Update streak & XP
    const streakResult = await this.updateStreakAndXp(userId, dto.recallQuality);

    // Award any newly unlocked badges (first review, streak & word milestones)
    const newBadges = await this.gamification.checkAndAwardBadges(userId);

    return {
      updated,
      acre: acreResult,
      xpGained: streakResult.xpGained,
      currentStreak: streakResult.currentStreak,
      streakIncreased: streakResult.streakIncreased,
      freezeUsed: streakResult.freezeUsed,
      streakFreezes: streakResult.streakFreezes,
      newBadges,
    };
  }

  private async updateStreakAndXp(userId: string, recallQuality: number) {
    const xpGained = recallQuality * 2; // max 10 XP per review

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });

    const nowUtc = new Date();
    const nowLocal = toZonedTime(nowUtc, user.timezone);
    const todayLocal = startOfDay(nowLocal);
    const todayUtc = fromZonedTime(todayLocal, user.timezone);

    const streak = await this.prisma.userStreak.findUnique({ where: { userId } });
    if (!streak) {
      return {
        xpGained: 0,
        currentStreak: 0,
        streakIncreased: false,
        freezeUsed: false,
        streakFreezes: 0,
      };
    }

    const lastActive = streak.lastActiveDate ? toZonedTime(streak.lastActiveDate, user.timezone) : null;
    const lastActiveDay = lastActive ? startOfDay(lastActive) : null;

    let newStreak = streak.currentStreak;
    let streakIncreased = false;
    let freezeUsed = false;
    let newFreezes = streak.streakFreezes;

    if (!lastActiveDay || lastActiveDay.getTime() < todayUtc.getTime()) {
      // Active today for first time — increment streak
      const yesterday = new Date(todayUtc);
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = lastActiveDay && lastActiveDay.getTime() >= yesterday.getTime();
      if (wasYesterday) {
        newStreak = streak.currentStreak + 1;
      } else {
        const twoDaysAgo = new Date(todayUtc);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const missedExactlyOneDay =
          !!lastActiveDay &&
          lastActiveDay.getTime() >= twoDaysAgo.getTime() &&
          lastActiveDay.getTime() < yesterday.getTime();

        if (missedExactlyOneDay && streak.streakFreezes > 0) {
          newStreak = streak.currentStreak;
          newFreezes = streak.streakFreezes - 1;
          freezeUsed = true;
        } else {
          newStreak = 1;
        }
      }

      if (newStreak > 0 && newStreak % 7 === 0) {
        newFreezes = Math.min(MAX_STREAK_FREEZES, newFreezes + 1);
      }

      streakIncreased = true;
    }

    await this.prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(streak.longestStreak, newStreak),
        streakFreezes: newFreezes,
        lastActiveDate: nowUtc,
        totalXp: { increment: xpGained },
        weeklyXp: { increment: xpGained },
      },
    });

    return {
      xpGained,
      currentStreak: newStreak,
      streakIncreased,
      freezeUsed,
      streakFreezes: newFreezes,
    };
  }

  private async _updateWordsLearned(userId: string, vocabularyBaseId: string): Promise<void> {
    // Fetch sibling vocab IDs so we can COUNT learned words accurately
    const psvList = await this.prisma.pathStageVocab.findMany({
      where: { vocabularyBaseId },
      include: {
        pathStage: {
          include: { stageVocabs: { select: { vocabularyBaseId: true } } },
        },
      },
    });

    for (const psv of psvList) {
      const ups = await this.prisma.userPathStage.findFirst({
        where: {
          pathStageId: psv.pathStageId,
          isUnlocked: true,
          isCompleted: false,
          userPath: { userId },
        },
      });

      if (!ups) continue;

      // COUNT from DB to avoid +1 drift when words were pre-learned
      const stageVocabIds = psv.pathStage.stageVocabs.map((sv) => sv.vocabularyBaseId);
      const learnedCount = await this.prisma.userVocabulary.count({
        where: { userId, vocabularyBaseId: { in: stageVocabIds }, isLearned: true },
      });
      const newWordsLearned = Math.min(learnedCount, psv.pathStage.wordCount);
      await this.prisma.userPathStage.update({
        where: { id: ups.id },
        data: { wordsLearned: newWordsLearned },
      });

      if (newWordsLearned >= psv.pathStage.wordCount) {
        await this._autoCompleteStage(userId, ups.id);
      }
    }
  }

  private async _autoCompleteStage(userId: string, userPathStageId: string): Promise<void> {
    const ups = await this.prisma.userPathStage.findUnique({
      where: { id: userPathStageId },
      include: {
        userPath: true,
        pathStage: { select: { order: true, xpReward: true, pathTemplateId: true, wordCount: true } },
      },
    });
    if (!ups || ups.isCompleted) return;

    const completedAt = new Date();
    await this.prisma.userPathStage.update({
      where: { id: userPathStageId },
      data: { isCompleted: true, completedAt, wordsLearned: ups.pathStage.wordCount },
    });

    // Find and unlock next stage
    const nextPathStage = await this.prisma.pathStage.findFirst({
      where: {
        pathTemplateId: ups.pathStage.pathTemplateId,
        order: ups.pathStage.order + 1,
      },
      include: { stageVocabs: true },
    });

    if (nextPathStage) {
      await this.prisma.userPathStage.update({
        where: {
          userPathId_pathStageId: {
            userPathId: ups.userPathId,
            pathStageId: nextPathStage.id,
          },
        },
        data: { isUnlocked: true, unlockedAt: new Date() },
      });
      if (nextPathStage.stageVocabs.length > 0) {
        await this.prisma.userVocabulary.createMany({
          data: nextPathStage.stageVocabs.map((sv) => ({
            userId,
            vocabularyBaseId: sv.vocabularyBaseId,
            sourceType: 'path',
          })),
          skipDuplicates: true,
        });
        // Sync wordsLearned for newly unlocked stage — some words may already be known
        const nextVocabIds = nextPathStage.stageVocabs.map((sv) => sv.vocabularyBaseId);
        const alreadyLearned = await this.prisma.userVocabulary.count({
          where: { userId, vocabularyBaseId: { in: nextVocabIds }, isLearned: true },
        });
        if (alreadyLearned > 0) {
          await this.prisma.userPathStage.update({
            where: {
              userPathId_pathStageId: {
                userPathId: ups.userPathId,
                pathStageId: nextPathStage.id,
              },
            },
            data: { wordsLearned: Math.min(alreadyLearned, nextPathStage.stageVocabs.length) },
          });
        }
      }
      await this.prisma.userPath.update({
        where: { id: ups.userPathId },
        data: { currentStageOrder: nextPathStage.order },
      });
    } else {
      // Path fully completed
      await this.prisma.userPath.update({
        where: { id: ups.userPathId },
        data: { completedAt },
      });
    }

    // Award XP
    await this.prisma.userStreak.upsert({
      where: { userId },
      create: { userId, totalXp: ups.pathStage.xpReward },
      update: { totalXp: { increment: ups.pathStage.xpReward } },
    });
  }
}
