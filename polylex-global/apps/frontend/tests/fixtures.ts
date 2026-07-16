import { expect, type Page, test as base } from '@playwright/test';

export const user = {
  id: 'user-e2e',
  email: 'learner@example.com',
  displayName: 'PolyLex Learner',
  nativeLanguageCode: 'en',
  nativeLanguageName: 'English',
  timezone: 'UTC',
  dailyGoal: 20,
  totalXp: 540,
  currentStreak: 7,
  isOnboarded: true,
  learningLanguages: [{
    code: 'ja', name: 'Japanese', nativeName: '日本語', currentCefrLevel: 'A1', targetCefrLevel: 'B1', isPrimary: true,
  }],
};

export const pathFixture = {
  id: 'path-e2e',
  pathTemplateId: 'template-e2e',
  title: 'Japanese Foundations',
  description: 'Build confidence with everyday phrases.',
  emoji: '🗾',
  totalWords: 12,
  currentStageOrder: 1,
  completedAt: null,
  stages: [{
    id: 'stage-e2e', title: 'Greetings', description: 'Common greetings', order: 1,
    vocabularyCount: 12, isCompleted: false, isLocked: false, unlockedAt: '2026-01-01T00:00:00.000Z',
  }],
};

export const reviewItem = {
  id: 'review-e2e', memoryStrength: 0.2, reviewCount: 0, isLeech: false, isLearned: false, sourceType: 'path',
  vocabularyBase: {
    id: 'vocab-e2e', term: 'こんにちは', phonetic: 'konnichiwa', exampleSentence: 'こんにちは。',
    audioUrl: null, cefrLevel: 'A1', language: { code: 'ja', name: 'Japanese' }, translations: [],
  },
};

const stats = {
  currentStreak: 7, longestStreak: 14, streakFreezes: 1, totalXp: 540, weeklyXp: 90,
  level: 4, xpInLevel: 40, xpForNextLevel: 100, dailyXp: 12, dailyGoal: 20,
  dailyProgressPercent: 60, isDailyGoalReached: false, totalWordCount: 42, masteredWordCount: 18, badges: [],
};

export async function mockApi(page: Page, options: { emptyReview?: boolean } = {}) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname.replace(/^\/api\/v1/, '');
    let body: unknown = {};

    if (pathname === '/auth/demo' || pathname === '/auth/login') body = { accessToken: 'e2e-access', refreshToken: 'e2e-refresh' };
    else if (pathname === '/users/me') body = user;
    else if (pathname === '/users/me/languages') body = user;
    else if (pathname === '/users/me/tts-preferences') body = { ttsVoiceGender: 'FEMALE' };
    else if (pathname === '/languages') body = [
      { id: 'en', code: 'en', name: 'English', nativeName: 'English', rtl: false, flagEmoji: '🇬🇧' },
      { id: 'ja', code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false, flagEmoji: '🇯🇵' },
    ];
    else if (pathname === '/gamification/stats') body = stats;
    else if (pathname === '/gamification/leaderboard') body = { items: [], me: { rank: 1, displayName: user.displayName, weeklyXp: 90, isMe: true }, resetAt: '2026-07-20T00:00:00.000Z' };
    else if (pathname === '/review/queue') body = { items: options.emptyReview ? [] : [reviewItem], total: options.emptyReview ? 0 : 1, page: 1, limit: 20 };
    else if (pathname === '/review/submit') body = { xpGained: 10, currentStreak: 7, newBadges: [] };
    else if (pathname === '/paths/my') body = [pathFixture];
    else if (pathname === '/paths/generate') body = pathFixture;
    else if (pathname.includes('/complete')) body = { nextStageUnlocked: false };
    else if (pathname === '/quick-notes' || pathname === '/vocabulary') body = [];
    else if (pathname === '/analytics/heatmap' || pathname === '/analytics/velocity') body = [];
    else if (pathname === '/analytics/retention') body = { total: 20, passed: 16, retentionPercent: 80 };

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

export async function authenticate(page: Page) {
  await page.addInitScript(({ persistedUser }) => {
    localStorage.setItem('polylex-locale', 'en');
    localStorage.setItem('polylex-auth', JSON.stringify({
      state: { accessToken: 'e2e-access', refreshToken: 'e2e-refresh', user: persistedUser }, version: 0,
    }));
  }, { persistedUser: user });
}

export async function disableMotion(page: Page) {
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}' });
  await page.evaluate(() => document.fonts.ready);
}

export const test = base;
export { expect };
