import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserProfile } from '@polylex/shared-types';

type ProfileResponse = Omit<UserProfile, 'learningLanguages'> & {
  nativeLanguageName: string;
  learningLanguages: Array<UserProfile['learningLanguages'][number] & { isPrimary: boolean }>;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        nativeLanguage: true,
        learningPaths: { include: { targetLanguage: true }, where: { isActive: true } },
        streak: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      nativeLanguageCode: user.nativeLanguage?.code ?? 'en',
      nativeLanguageName: user.nativeLanguage?.name ?? 'English',
      timezone: user.timezone,
      dailyGoal: user.dailyGoal,
      totalXp: user.streak?.totalXp ?? 0,
      currentStreak: user.streak?.currentStreak ?? 0,
      isOnboarded: user.isOnboarded,
      learningLanguages: user.learningPaths.map((lp) => ({
        code: lp.targetLanguage.code,
        name: lp.targetLanguage.name,
        nativeName: lp.targetLanguage.nativeName,
        currentCefrLevel: lp.currentCefrLevel,
        targetCefrLevel: lp.targetCefrLevel,
        isPrimary: (lp as { isPrimary?: boolean }).isPrimary ?? false,
      })),
    };
  }

  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      dailyGoal?: number;
      timezone?: string;
      nativeLanguageCode?: string;
      primaryLearningLanguageCode?: string;
    },
  ) {
    const {
      nativeLanguageCode,
      primaryLearningLanguageCode,
      ...basicData
    } = data;

    await this.prisma.$transaction(async (transaction) => {
      if (Object.keys(basicData).length > 0) {
        await transaction.user.update({
          where: { id: userId },
          data: basicData,
        });
      }

      if (nativeLanguageCode) {
        const nativeLanguage = await transaction.language.findUniqueOrThrow({
          where: { code: nativeLanguageCode },
        });

        await transaction.user.update({
          where: { id: userId },
          data: { nativeLanguageId: nativeLanguage.id, isOnboarded: true },
        });
      }

      if (primaryLearningLanguageCode) {
        const primaryLanguage = await transaction.language.findUniqueOrThrow({
          where: { code: primaryLearningLanguageCode },
        });

        const resetPrimaryData = { isPrimary: false };
        const setPrimaryData = { isPrimary: true };

        await transaction.learningPath.updateMany({
          where: { userId, isActive: true },
          data: resetPrimaryData,
        });

        await transaction.learningPath.updateMany({
          where: {
            userId,
            isActive: true,
            targetLanguageId: primaryLanguage.id,
          },
          data: setPrimaryData,
        });
      }
    });

    return this.getProfile(userId);
  }

  async addLearningLanguage(userId: string, languageCode: string, targetCefrLevel: string) {
    const language = await this.prisma.language.findUniqueOrThrow({
      where: { code: languageCode },
    });

    return this.prisma.$transaction(async (transaction) => {
      const activeCount = await transaction.learningPath.count({
        where: { userId, isActive: true },
      });

      const createData = {
        userId,
        targetLanguageId: language.id,
        targetCefrLevel,
        isActive: true,
        isPrimary: activeCount === 0,
      };

      return transaction.learningPath.upsert({
        where: { userId_targetLanguageId: { userId, targetLanguageId: language.id } },
        create: createData,
        update: { isActive: true, targetCefrLevel },
      });
    });
  }

  async getTtsPreferences(userId: string): Promise<{ ttsVoiceGender: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { ttsVoiceGender: true },
    });
    return { ttsVoiceGender: user.ttsVoiceGender };
  }

  async updateTtsPreferences(
    userId: string,
    ttsVoiceGender: 'MALE' | 'FEMALE',
  ): Promise<{ ttsVoiceGender: string }> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { ttsVoiceGender },
      select: { ttsVoiceGender: true },
    });
    return { ttsVoiceGender: user.ttsVoiceGender };
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const createdTemplates = await transaction.pathTemplate.findMany({
        where: { createdByUserId: userId },
        select: { id: true },
      });

      if (createdTemplates.length > 0) {
        const templateIds = createdTemplates.map((template) => template.id);

        await transaction.userPathStage.deleteMany({
          where: { userPath: { pathTemplateId: { in: templateIds } } },
        });

        await transaction.userPath.deleteMany({
          where: { pathTemplateId: { in: templateIds } },
        });

        await transaction.pathTemplate.deleteMany({
          where: { id: { in: templateIds } },
        });
      }

      await transaction.user.delete({ where: { id: userId } });
    });
  }
}
