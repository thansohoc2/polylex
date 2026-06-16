import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { VocabularyService } from '../vocabulary/vocabulary.service';
import { YouTubeService } from '../youtube/youtube.service';
import {
  GeneratePathDto,
  PathDto,
  PathStageDto,
  PathStageVocabDto,
  CompleteStageResponseDto,
  StageDialogueDto,
  DialogueLineDto,
} from './dto/paths.dto';

@Injectable()
export class PathsService {
  private readonly logger = new Logger(PathsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly vocabularyService: VocabularyService,
    private readonly youtubeService: YouTubeService,
  ) {}

  async createFromAI(
    userId: string,
    dto: GeneratePathDto,
    role?: string,
    email?: string,
  ): Promise<PathDto> {
    const isDemoUser = role === 'DEMO' || email?.endsWith('@polylex.guest');

    if (isDemoUser) {
      const demoCount = await this.prisma.pathTemplate.count({
        where: {
          createdByUserId: userId,
        },
      });

      if (demoCount >= 1) {
        throw new ForbiddenException('DEMO_PATH_LIMIT_REACHED');
      }
    }

    // Rate limit: max 3 paths created today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayCount = await this.prisma.pathTemplate.count({
      where: {
        createdByUserId: userId,
        createdAt: { gte: startOfToday },
      },
    });

    if (todayCount >= 4) {
      throw new ForbiddenException('You can only generate 3 learning paths per day');
    }

    // Resolve languages
    const targetLang = await this.prisma.language.findUniqueOrThrow({
      where: { code: dto.targetLanguageCode },
    });

    let nativeLangId: string | null = null;
    let nativeLangName = 'English';

    const nativeCode = dto.nativeLanguageCode;
    if (nativeCode) {
      const nativeLang = await this.prisma.language.findUnique({ where: { code: nativeCode } });
      if (nativeLang) {
        nativeLangId = nativeLang.id;
        nativeLangName = nativeLang.name;
      }
    } else {
      // Fallback to user's native language
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { nativeLanguage: true },
      });
      if (user?.nativeLanguage) {
        nativeLangId = user.nativeLanguage.id;
        nativeLangName = user.nativeLanguage.name;
      }
    }

    // Generate path via AI
    const aiResult = await this.aiService.generateLearningPath(
      dto.goal,
      targetLang.name,
      nativeLangName,
      dto.targetCefrLevel,
    );

    const totalWords = aiResult.stages.reduce((sum, s) => sum + s.vocab.length, 0);

    // Create everything in a single transaction
    let pathTemplateId: string;

    await this.prisma.$transaction(async (tx) => {
      const pathTemplate = await tx.pathTemplate.create({
        data: {
          title: aiResult.title,
          description: aiResult.description ?? null,
          emoji: aiResult.emoji,
          goalInput: dto.goal,
          targetLanguageId: targetLang.id,
          nativeLanguageId: nativeLangId ?? undefined,
          targetCefrLevel: dto.targetCefrLevel,
          totalWords,
          createdByUserId: userId,
        },
      });
      pathTemplateId = pathTemplate.id;

      for (const stageData of aiResult.stages) {
        const pathStage = await tx.pathStage.create({
          data: {
            pathTemplateId: pathTemplate.id,
            order: stageData.order,
            title: stageData.title,
            description: stageData.description ?? null,
            wordCount: stageData.vocab.length,
          },
        });

        // Upsert vocabulary outside transaction (uses prisma directly)
        const vocabItems = stageData.vocab.map((v) => ({
          term: v.term,
          phonetic: v.phonetic,
          phoneticRomaji: v.phoneticRomaji,
          cefrLevel: v.cefrLevel,
          partOfSpeech: v.partOfSpeech,
          exampleSentence: v.exampleSentence,
          translation: v.translation,
        }));

        if (nativeLangId) {
          const upserted = await this.vocabularyService.upsertBulk(
            vocabItems,
            targetLang.id,
            nativeLangId,
          );

          for (let i = 0; i < upserted.length; i++) {
            await tx.pathStageVocab.create({
              data: {
                pathStageId: pathStage.id,
                vocabularyBaseId: upserted[i].id,
                order: i,
              },
            });
          }
        }
      }
    });

    // Enroll user into the newly created path
    await this.enrollUser(userId, pathTemplateId!);

    // Generate dialogue for each stage — parallel, fail-safe (skip on error)
    if (this.aiService.isEnabled) {
      const stagesWithVocab = await this.prisma.pathStage.findMany({
        where: { pathTemplateId: pathTemplateId! },
        orderBy: { order: 'asc' },
        include: {
          stageVocabs: {
            include: { vocabularyBase: { select: { term: true } } },
          },
        },
      });

      await Promise.all(
        stagesWithVocab.map(async (stage) => {
          try {
            const terms = stage.stageVocabs.map((sv) => sv.vocabularyBase.term);
            const stageAiData = aiResult.stages.find((s) => s.order === stage.order);
            const cefrLevel = stageAiData?.vocab[0]?.cefrLevel ?? dto.targetCefrLevel;
            const lines = await this.aiService.generateStageDialogue(
              terms,
              targetLang.name,
              nativeLangName,
              cefrLevel,
              stage.title,
            );
            await this.prisma.pathStageDialogue.create({
              data: { pathStageId: stage.id, lines: lines as any },
            });
          } catch (err) {
            this.logger.warn(`Dialogue generation skipped for stage ${stage.id}: ${err}`);
          }
        }),
      );
    }

    // Generate videos for each stage — parallel, fail-safe (skip on error)
    if (this.aiService.isEnabled && this.youtubeService.isEnabled()) {
      const stagesWithVocab = await this.prisma.pathStage.findMany({
        where: { pathTemplateId: pathTemplateId! },
        orderBy: { order: 'asc' },
        include: {
          stageVocabs: {
            include: { vocabularyBase: { select: { term: true } } },
          },
        },
      });

      await Promise.all(
        stagesWithVocab.map(async (stage) => {
          try {
            const terms = stage.stageVocabs.map((sv) => sv.vocabularyBase.term);
            const stageAiData = aiResult.stages.find((s) => s.order === stage.order);
            const cefrLevel = stageAiData?.vocab[0]?.cefrLevel ?? dto.targetCefrLevel;

            // Step 1: Generate search query
            const searchQuery = await this.aiService.generateVideoQuery(
              terms,
              targetLang.code,
              stage.title,
              cefrLevel,
            );

            // Step 2: Search YouTube
            const candidates = await this.youtubeService.search(
              searchQuery,
              targetLang.code,
            );

            if (candidates.length === 0) {
              this.logger.warn(`No YouTube videos found for stage ${stage.id} with query: "${searchQuery}"`);
              return;
            }

            // Step 3: AI re-rank videos
            const rankedVideos = await this.aiService.rankVideos(
              candidates.map((c) => ({
                videoId: c.videoId,
                title: c.title,
                description: c.description,
                channelTitle: c.channelTitle,
                durationSeconds: c.durationSeconds,
              })),
              {
                stageTitle: stage.title,
                cefrLevel,
                terms,
                targetLanguage: targetLang.name,
              },
            );

            // Step 4: Save to DB
            if (rankedVideos.length > 0) {
              await this.prisma.pathStageVideo.createMany({
                data: rankedVideos.map((v, order) => {
                  const candidate = candidates.find((c) => c.videoId === v.youtubeVideoId)!;
                  return {
                    pathStageId: stage.id,
                    youtubeVideoId: v.youtubeVideoId,
                    title: candidate.title,
                    channelTitle: candidate.channelTitle,
                    thumbnailUrl: candidate.thumbnailUrl,
                    durationSeconds: candidate.durationSeconds,
                    relevanceScore: v.relevanceScore,
                    aiReason: v.aiReason,
                    order,
                  };
                }),
              });
            }
          } catch (err) {
            this.logger.warn(`Video generation skipped for stage ${stage.id}: ${err}`);
          }
        }),
      );
    }

    return this.getPathById(userId, pathTemplateId!);
  }

  async enrollUser(userId: string, pathTemplateId: string): Promise<void> {
    // Check if already enrolled
    const existing = await this.prisma.userPath.findUnique({
      where: { userId_pathTemplateId: { userId, pathTemplateId } },
    });
    if (existing) {
      throw new ConflictException('Already enrolled in this path');
    }

    const stages = await this.prisma.pathStage.findMany({
      where: { pathTemplateId },
      orderBy: { order: 'asc' },
      include: { stageVocabs: true },
    });

    if (stages.length === 0) {
      throw new NotFoundException('Path has no stages');
    }

    const userPath = await this.prisma.userPath.create({
      data: { userId, pathTemplateId, currentStageOrder: 1 },
    });

    await this.prisma.userPathStage.createMany({
      data: stages.map((s) => ({
        userPathId: userPath.id,
        pathStageId: s.id,
        isUnlocked: s.order === 1,
        unlockedAt: s.order === 1 ? new Date() : null,
      })),
    });

    // Add stage 1 vocab to user's vocabulary (mark as path source)
    const stage1 = stages[0];
    if (stage1.stageVocabs.length > 0) {
      await this.prisma.userVocabulary.createMany({
        data: stage1.stageVocabs.map((sv) => ({
          userId,
          vocabularyBaseId: sv.vocabularyBaseId,
          sourceType: 'path',
        })),
        skipDuplicates: true,
      });
      // Sync wordsLearned: words from other paths/quicknotes may already be isLearned
      const vocabIds = stage1.stageVocabs.map((sv) => sv.vocabularyBaseId);
      const alreadyLearned = await this.prisma.userVocabulary.count({
        where: { userId, vocabularyBaseId: { in: vocabIds }, isLearned: true },
      });
      if (alreadyLearned > 0) {
        await this.prisma.userPathStage.update({
          where: { userPathId_pathStageId: { userPathId: userPath.id, pathStageId: stage1.id } },
          data: { wordsLearned: Math.min(alreadyLearned, stage1.wordCount) },
        });
      }
    }
  }

  async completeStage(userId: string, userPathStageId: string): Promise<CompleteStageResponseDto> {
    const userPathStage = await this.prisma.userPathStage.findFirstOrThrow({
      where: { id: userPathStageId, userPath: { userId } },
      include: { userPath: true, pathStage: true },
    });

    if (userPathStage.isCompleted) {
      throw new ConflictException('Stage already completed');
    }

    if (!userPathStage.isUnlocked) {
      throw new ForbiddenException('Stage is not unlocked yet');
    }

    const completedAt = new Date();

    await this.prisma.userPathStage.update({
      where: { id: userPathStageId },
      data: { isCompleted: true, completedAt },
    });

    // Find next stage
    const nextStage = await this.prisma.pathStage.findFirst({
      where: {
        pathTemplateId: userPathStage.userPath.pathTemplateId,
        order: userPathStage.pathStage.order + 1,
      },
      include: { stageVocabs: true },
    });

    if (nextStage) {
      // Unlock next stage
      await this.prisma.userPathStage.update({
        where: {
          userPathId_pathStageId: {
            userPathId: userPathStage.userPathId,
            pathStageId: nextStage.id,
          },
        },
        data: { isUnlocked: true, unlockedAt: new Date() },
      });

      // Add next stage vocab to user's vocabulary (mark as path source)
      if (nextStage.stageVocabs.length > 0) {
        await this.prisma.userVocabulary.createMany({
          data: nextStage.stageVocabs.map((sv) => ({
            userId,
            vocabularyBaseId: sv.vocabularyBaseId,
            sourceType: 'path',
          })),
          skipDuplicates: true,
        });
        // Sync wordsLearned for newly unlocked stage — some words may already be known
        const nextVocabIds = nextStage.stageVocabs.map((sv) => sv.vocabularyBaseId);
        const alreadyLearned = await this.prisma.userVocabulary.count({
          where: { userId, vocabularyBaseId: { in: nextVocabIds }, isLearned: true },
        });
        if (alreadyLearned > 0) {
          const nextUps = await this.prisma.userPathStage.findFirst({
            where: { userPathId: userPathStage.userPathId, pathStageId: nextStage.id },
          });
          if (nextUps) {
            await this.prisma.userPathStage.update({
              where: { id: nextUps.id },
              data: { wordsLearned: Math.min(alreadyLearned, nextStage.stageVocabs.length) },
            });
          }
        }
      }

      // Update current stage order
      await this.prisma.userPath.update({
        where: { id: userPathStage.userPathId },
        data: { currentStageOrder: nextStage.order },
      });
    } else {
      // Path completed
      await this.prisma.userPath.update({
        where: { id: userPathStage.userPathId },
        data: { completedAt },
      });
    }

    // Award XP
    await this.prisma.userStreak.upsert({
      where: { userId },
      create: { userId, totalXp: userPathStage.pathStage.xpReward },
      update: { totalXp: { increment: userPathStage.pathStage.xpReward } },
    });

    return {
      nextStageUnlocked: nextStage !== null,
      completedAt: completedAt.toISOString(),
    };
  }

  async getMyPaths(userId: string): Promise<PathDto[]> {
    const userPaths = await this.prisma.userPath.findMany({
      where: { userId },
      include: {
        pathTemplate: {
          include: {
            stages: {
              orderBy: { order: 'asc' },
              include: {
                dialogue: true,
                videos: true,
                stageVocabs: {
                  orderBy: { order: 'asc' },
                  include: {
                    vocabularyBase: {
                      include: { translations: true },
                    },
                  },
                },
              },
            },
          },
        },
        userStages: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    return userPaths.map((up) => this.mapToPathDto(up));
  }

  async getPathById(userId: string, pathTemplateId: string): Promise<PathDto> {
    const userPath = await this.prisma.userPath.findFirstOrThrow({
      where: { userId, pathTemplateId },
      include: {
        pathTemplate: {
          include: {
            stages: {
              orderBy: { order: 'asc' },
              include: {
                dialogue: true,
                videos: true,
                stageVocabs: {
                  orderBy: { order: 'asc' },
                  include: {
                    vocabularyBase: {
                      include: { translations: true },
                    },
                  },
                },
              },
            },
          },
        },
        userStages: true,
      },
    });

    return this.mapToPathDto(userPath);
  }

  private mapToPathDto(userPath: any): PathDto {
    const template = userPath.pathTemplate;
    const stages: PathStageDto[] = template.stages.map((stage: any) => {
      const userStage = userPath.userStages.find((us: any) => us.pathStageId === stage.id);

      const vocab: PathStageVocabDto[] = stage.stageVocabs.map((sv: any) => {
        const vb = sv.vocabularyBase;
        const translation = vb.translations?.[0];
        return {
          id: vb.id,
          term: vb.term,
          phonetic: vb.phonetic,
          phoneticRomaji: vb.phoneticRomaji,
          cefrLevel: vb.cefrLevel,
          partOfSpeech: vb.partOfSpeech,
          translation: translation?.translation ?? null,
          exampleSentence: vb.exampleSentence,
        } as PathStageVocabDto;
      });

      return {
        id: userStage?.id ?? stage.id,
        pathStageId: stage.id,
        hasDialogue: !!stage.dialogue,
        hasVideos: (stage.videos?.length ?? 0) > 0,
        order: stage.order,
        title: stage.title,
        description: stage.description,
        wordCount: stage.wordCount,
        xpReward: stage.xpReward,
        isUnlocked: userStage?.isUnlocked ?? false,
        isCompleted: userStage?.isCompleted ?? false,
        wordsLearned: userStage?.wordsLearned ?? 0,
        vocab,
      } as PathStageDto;
    });

    return {
      id: userPath.id,
      pathTemplateId: template.id,
      title: template.title,
      description: template.description,
      emoji: template.emoji,
      totalWords: template.totalWords,
      currentStageOrder: userPath.currentStageOrder,
      completedAt: userPath.completedAt,
      stages,
    };
  }

  async getStageDialogue(userId: string, pathStageId: string): Promise<StageDialogueDto> {
    // Verify user has access to this stage via UserPathStage
    const userStage = await this.prisma.userPathStage.findFirst({
      where: { pathStageId, userPath: { userId } },
      include: {
        pathStage: {
          include: {
            dialogue: true,
            pathTemplate: {
              include: { targetLanguage: true },
            },
          },
        },
      },
    });

    if (!userStage) {
      throw new ForbiddenException('No access to this stage');
    }

    const dialogue = userStage.pathStage.dialogue;
    if (!dialogue) {
      throw new NotFoundException('Dialogue not available for this stage');
    }

    return {
      pathStageId,
      stageTitle: userStage.pathStage.title,
      targetLanguageCode: userStage.pathStage.pathTemplate.targetLanguage.code,
      lines: dialogue.lines as unknown as DialogueLineDto[],
    };
  }

  async getStageVideos(
    userId: string,
    pathStageId: string,
  ): Promise<{
    data: Array<{
      id: string;
      youtubeVideoId: string;
      title: string;
      channelTitle: string;
      thumbnailUrl: string;
      durationSeconds: number;
      aiReason: string;
    }>;
    stageTitle: string;
  }> {
    // Verify user has access to this stage via UserPathStage
    const userStage = await this.prisma.userPathStage.findFirst({
      where: { pathStageId, userPath: { userId } },
      include: {
        pathStage: {
          include: {
            videos: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!userStage) {
      throw new ForbiddenException('No access to this stage');
    }

    return {
      data: userStage.pathStage.videos.map((v) => ({
        id: v.id,
        youtubeVideoId: v.youtubeVideoId,
        title: v.title,
        channelTitle: v.channelTitle || '',
        thumbnailUrl: v.thumbnailUrl || '',
        durationSeconds: v.durationSeconds || 0,
        aiReason: v.aiReason || '',
      })),
      stageTitle: userStage.pathStage.title,
    };
  }
}