import { ForbiddenException } from '@nestjs/common';
import {
  filterGeneratedPathVocabulary,
  getMinimumPathCefrLevel,
  PathsService,
} from './paths.service';

describe('PathsService.createFromAI', () => {
  const prisma = {
    pathTemplate: { count: jest.fn() },
    language: { findUniqueOrThrow: jest.fn(), findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    userPath: { findFirst: jest.fn() },
    learningPath: { findUnique: jest.fn() },
    vocabularyBase: { findMany: jest.fn() },
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

  it('excludes only vocabulary at 100% memory strength from prior learning', async () => {
    const generationError = new Error('stop after context assertion');
    prisma.pathTemplate.count.mockResolvedValue(0);
    prisma.language.findUniqueOrThrow.mockResolvedValue({ id: 'lang-ja', name: 'Japanese' });
    prisma.language.findUnique.mockResolvedValue({ id: 'lang-vi', name: 'Vietnamese' });
    prisma.userPath.findFirst.mockResolvedValue(null);
    prisma.learningPath.findUnique.mockResolvedValue({ currentCefrLevel: 'B1' });
    prisma.vocabularyBase.findMany.mockResolvedValue([{ term: '予約' }]);
    aiService.generateLearningPath.mockRejectedValue(generationError);

    await expect(
      service.createFromAI('user-1', {
        goal: 'Travel to Japan',
        targetLanguageCode: 'ja',
        nativeLanguageCode: 'vi',
        targetCefrLevel: 'B2',
      }),
    ).rejects.toBe(generationError);

    expect(prisma.vocabularyBase.findMany).toHaveBeenCalledWith({
      where: {
        languageId: 'lang-ja',
        OR: [
          { cefrLevel: { in: ['A1', 'A2'] } },
          {
            userVocabularies: {
              some: { userId: 'user-1', memoryStrength: { gte: 1 } },
            },
          },
        ],
      },
      select: { term: true },
    });
    expect(aiService.generateLearningPath).toHaveBeenCalledWith(
      'Travel to Japan',
      'Japanese',
      'Vietnamese',
      'B2',
      { currentCefrLevel: 'B1', excludedTerms: ['予約'] },
    );
  });
});

describe('filterGeneratedPathVocabulary', () => {
  it('removes excluded, repeated, and below-level words', () => {
    const path = {
      title: 'Travel',
      emoji: 'plane',
      stages: [
        {
          order: 1,
          title: 'Airport',
          vocab: [
            { term: 'Hello', cefrLevel: 'A1', translation: 'xin chao' },
            { term: 'Reservation', cefrLevel: 'B1', translation: 'dat cho' },
          ],
        },
        {
          order: 2,
          title: 'Hotel',
          vocab: [
            { term: ' reservation ', cefrLevel: 'B1', translation: 'dat cho' },
            { term: 'Availability', cefrLevel: 'B2', translation: 'tinh trang con cho' },
            { term: 'Itinerary', cefrLevel: 'C1', translation: 'lich trinh' },
          ],
        },
      ],
    };

    const filtered = filterGeneratedPathVocabulary(path, ['HELLO'], 'B1', 'B2');

    expect(filtered.stages[0].vocab.map((word) => word.term)).toEqual(['Reservation']);
    expect(filtered.stages[1].vocab.map((word) => word.term)).toEqual(['Availability']);
  });

  it.each([
    ['A1', 'A1', 'A1'],
    ['A1', 'B1', 'A2'],
    ['B1', 'B2', 'B1'],
    ['B2', 'B1', 'B1'],
  ])('uses a practical range for current %s and target %s', (current, target, expected) => {
    expect(getMinimumPathCefrLevel(current, target)).toBe(expected);
  });
});
