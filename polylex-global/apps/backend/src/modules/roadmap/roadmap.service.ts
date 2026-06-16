import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RoadmapRecommendation,
  CefrLevel,
  CEFR_VOCABULARY_THRESHOLDS,
  SKILLS,
} from '@polylex/shared-types';

@Injectable()
export class RoadmapService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecommendations(userId: string, languageCode: string): Promise<RoadmapRecommendation[]> {
    const language = await this.prisma.language.findUniqueOrThrow({
      where: { code: languageCode },
    });

    const learningPath = await this.prisma.learningPath.findFirst({
      where: { userId, targetLanguageId: language.id, isActive: true },
    });

    if (!learningPath) {
      return this.getDefaultRecommendations('A1', 'B2');
    }

    const skillScores = await this.prisma.skillScore.findMany({
      where: { userId },
    });

    const totalLearned = await this.prisma.userVocabulary.count({
      where: {
        userId,
        vocabularyBase: { languageId: language.id },
      },
    });

    return this.buildRecommendations(
      learningPath.currentCefrLevel as CefrLevel,
      learningPath.targetCefrLevel as CefrLevel,
      totalLearned,
      skillScores,
    );
  }

  private buildRecommendations(
    current: CefrLevel,
    target: CefrLevel,
    wordsLearned: number,
    skillScores: { skill: string; score: number }[],
  ): RoadmapRecommendation[] {
    const recommendations: RoadmapRecommendation[] = [];
    const cefrOrder: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIdx = cefrOrder.indexOf(current);
    const targetIdx = cefrOrder.indexOf(target);

    for (let i = currentIdx; i <= targetIdx && i < cefrOrder.length; i++) {
      const level = cefrOrder[i];
      const threshold = CEFR_VOCABULARY_THRESHOLDS[level];
      const isCurrentLevel = i === currentIdx;
      const progressToLevel = isCurrentLevel
        ? Math.min(100, Math.round((wordsLearned / threshold) * 100))
        : 0;

      // Find weakest skill
      const weakestSkill = skillScores.length > 0
        ? skillScores.sort((a, b) => a.score - b.score)[0].skill
        : 'vocabulary';

      recommendations.push({
        cefrLevel: level,
        wordsRequired: threshold,
        wordsLearned: isCurrentLevel ? wordsLearned : 0,
        progressPercent: progressToLevel,
        suggestedSkillFocus: weakestSkill,
        isCurrentLevel,
        isCompleted: !isCurrentLevel,
      });
    }

    return recommendations;
  }

  private getDefaultRecommendations(current: CefrLevel, target: CefrLevel): RoadmapRecommendation[] {
    return this.buildRecommendations(current, target, 0, []);
  }

  async updateSkillScores(userId: string) {
    // Recalculate skill scores from review history patterns
    const recentHistory = await this.prisma.reviewHistory.findMany({
      where: { userId, reviewedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { reviewedAt: 'desc' },
      take: 200,
    });

    const modeScores: Record<string, number[]> = {};

    for (const review of recentHistory) {
      const mode = review.reviewMode;
      if (!modeScores[mode]) modeScores[mode] = [];
      modeScores[mode].push(review.recallQuality / 5);
    }

    for (const skill of SKILLS) {
      const relevantScores = modeScores[skill] ?? [];
      const avgScore = relevantScores.length > 0
        ? relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length
        : 0;

      await this.prisma.skillScore.upsert({
        where: { userId_skill: { userId, skill } },
        create: { userId, skill, score: avgScore },
        update: { score: avgScore, lastCalculated: new Date() },
      });
    }
  }
}
