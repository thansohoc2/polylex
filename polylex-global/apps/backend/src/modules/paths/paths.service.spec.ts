import { ForbiddenException } from '@nestjs/common';
import { PathsService } from './paths.service';

describe('PathsService.createFromAI', () => {
  const prisma = {
    pathTemplate: { count: jest.fn() },
    language: { findUniqueOrThrow: jest.fn(), findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    userPath: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  };

  const aiService = {
    generateLearningPath: jest.fn(),
    isEnabled: true,
  };

  const vocabularyService = {
    upsertBulk: jest.fn(),
  };

  const youtubeService = {
    isEnabled: jest.fn(() => false),
  };

  let service: PathsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PathsService(
      prisma as any,
      aiService as any,
      vocabularyService as any,
      youtubeService as any,
    );
  });

  it('throws when the user already has an incomplete path for the same target language', async () => {
    prisma.language.findUniqueOrThrow.mockResolvedValue({ id: 'lang-ja', name: 'Japanese' });
    prisma.userPath.findFirst.mockResolvedValue({ id: 'existing-path' });

    await expect(
      service.createFromAI(
        'user-1',
        {
          goal: 'Travel to Japan',
          targetLanguageCode: 'ja',
          nativeLanguageCode: 'vi',
          targetCefrLevel: 'B1',
        },
        'USER',
        'user@example.com',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.userPath.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          pathTemplate: { targetLanguageId: 'lang-ja' },
          completedAt: null,
        },
      }),
    );
    expect(aiService.generateLearningPath).not.toHaveBeenCalled();
  });
});
