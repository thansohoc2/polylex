import { calculateLevelFromXp, GamificationService } from './gamification.service';

describe('GamificationService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    userStreak: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    userBadge: {
      findMany: jest.fn(),
    },
    userVocabulary: {
      count: jest.fn(),
    },
    reviewHistory: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    userBadgeCreate: {
      createMany: jest.fn(),
    },
  };

  let service: GamificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GamificationService(
      {
        user: prisma.user,
        userStreak: prisma.userStreak,
        userBadge: {
          ...prisma.userBadge,
          createMany: prisma.userBadgeCreate.createMany,
        },
        userVocabulary: prisma.userVocabulary,
        reviewHistory: prisma.reviewHistory,
      } as never,
    );
  });

  it('getStats returns daily progress from today recallQuality sum', async () => {
    prisma.user.findUnique.mockResolvedValue({ timezone: 'UTC', dailyGoal: 20 });
    prisma.userStreak.findUnique.mockResolvedValue({
      currentStreak: 4,
      longestStreak: 7,
      streakFreezes: 1,
      totalXp: 300,
      weeklyXp: 40,
    });
    prisma.userBadge.findMany.mockResolvedValue([]);
    prisma.userVocabulary.count
      .mockResolvedValueOnce(25)
      .mockResolvedValueOnce(6);
    prisma.reviewHistory.aggregate.mockResolvedValue({ _sum: { recallQuality: 6 } });

    const stats = await service.getStats('user-1');

    expect(stats.dailyXp).toBe(12);
    expect(stats.dailyGoal).toBe(20);
    expect(stats.dailyProgressPercent).toBe(60);
    expect(stats.isDailyGoalReached).toBe(false);
    expect(stats.streakFreezes).toBe(1);
    expect(stats.level).toBe(3);
    expect(stats.xpInLevel).toBe(50);
    expect(stats.xpForNextLevel).toBe(200);
    expect(stats.masteredWordCount).toBe(6);
    expect(prisma.reviewHistory.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          reviewedAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    );
  });

  it('getStats marks goal reached when dailyXp >= dailyGoal', async () => {
    prisma.user.findUnique.mockResolvedValue({ timezone: 'UTC', dailyGoal: 10 });
    prisma.userStreak.findUnique.mockResolvedValue(null);
    prisma.userBadge.findMany.mockResolvedValue([]);
    prisma.userVocabulary.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    prisma.reviewHistory.aggregate.mockResolvedValue({ _sum: { recallQuality: 7 } });

    const stats = await service.getStats('user-1');

    expect(stats.dailyXp).toBe(14);
    expect(stats.dailyGoal).toBe(10);
    expect(stats.dailyProgressPercent).toBe(100);
    expect(stats.isDailyGoalReached).toBe(true);
    expect(stats.level).toBe(1);
    expect(stats.masteredWordCount).toBe(0);
  });

  it('calculateLevelFromXp handles level boundaries', () => {
    expect(calculateLevelFromXp(0)).toEqual({ level: 1, xpInLevel: 0, xpForNextLevel: 100 });
    expect(calculateLevelFromXp(99)).toEqual({ level: 1, xpInLevel: 99, xpForNextLevel: 100 });
    expect(calculateLevelFromXp(100)).toEqual({ level: 2, xpInLevel: 0, xpForNextLevel: 150 });
    expect(calculateLevelFromXp(250)).toEqual({ level: 3, xpInLevel: 0, xpForNextLevel: 200 });
  });

  it('getLeaderboard returns top entries and marks current user when in top list', async () => {
    prisma.userStreak.findMany.mockResolvedValue([
      { userId: 'user-1', weeklyXp: 120, user: { displayName: 'Alice' } },
      { userId: 'user-2', weeklyXp: 80, user: { displayName: 'Bob' } },
    ]);
    prisma.userStreak.findUnique.mockResolvedValue({
      userId: 'user-2',
      weeklyXp: 80,
      user: { displayName: 'Bob' },
    });

    const result = await service.getLeaderboard('user-2', 10);

    expect(result.items).toEqual([
      { rank: 1, displayName: 'Alice', weeklyXp: 120, isMe: false },
      { rank: 2, displayName: 'Bob', weeklyXp: 80, isMe: true },
    ]);
    expect(result.me).toEqual({ rank: 2, displayName: 'Bob', weeklyXp: 80, isMe: true });
    expect(result.resetAt).toEqual(expect.any(String));
    expect(prisma.userStreak.count).not.toHaveBeenCalled();
  });

  it('getLeaderboard returns current user rank even when outside top list', async () => {
    prisma.userStreak.findMany.mockResolvedValue([
      { userId: 'user-1', weeklyXp: 300, user: { displayName: 'Alice' } },
      { userId: 'user-2', weeklyXp: 220, user: { displayName: 'Bob' } },
    ]);
    prisma.userStreak.findUnique.mockResolvedValue({
      userId: 'user-9',
      weeklyXp: 75,
      user: { displayName: 'Me' },
    });
    prisma.userStreak.count.mockResolvedValue(5);

    const result = await service.getLeaderboard('user-9', 2);

    expect(result.items).toHaveLength(2);
    expect(result.me).toEqual({ rank: 6, displayName: 'Me', weeklyXp: 75, isMe: true });
    expect(prisma.userStreak.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      }),
    );
  });

  it('checkAndAwardBadges awards perfect session and timing badges', async () => {
    prisma.userStreak.findUnique.mockResolvedValue({ currentStreak: 12, totalXp: 2000 });
    prisma.userVocabulary.count.mockResolvedValue(120);
    prisma.user.findUnique.mockResolvedValue({ timezone: 'UTC' });
    prisma.userBadge.findMany.mockResolvedValue([]);
    prisma.reviewHistory.count.mockResolvedValue(20);
    prisma.reviewHistory.findMany.mockResolvedValue([
      { recallQuality: 5 },
      { recallQuality: 4 },
      { recallQuality: 5 },
      { recallQuality: 4 },
      { recallQuality: 5 },
    ]);

    const awarded = await service.checkAndAwardBadges('user-1');

    expect(awarded).toContain('PERFECT_SESSION');
    expect(awarded).toContain('WORDS_100');
    expect(prisma.userBadgeCreate.createMany).toHaveBeenCalled();
  });
});
