export type ReviewMode = 'flashcard' | 'type_answer' | 'reverse' | 'listening' | 'context' | 'sentence';
export interface AcreInput {
    recallQuality: number;
    responseTimeMs: number;
    confidenceLevel: number;
    memoryStrength: number;
    leechScore: number;
    difficultyUser: number;
    reviewMode: ReviewMode;
    reviewCount: number;
    currentIntervalDays?: number;
}
export interface AcreOutput {
    newMemoryStrength: number;
    intervalDays: number;
    nextReview: Date;
    newLeechScore: number;
    isLeech: boolean;
    recommendedMode: ReviewMode;
}
export declare const LEECH_THRESHOLD = 8;
export type Skill = 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary' | 'grammar';
export declare const SKILLS: Skill[];
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export declare const CEFR_VOCABULARY_THRESHOLDS: Record<CefrLevel, number>;
export interface FlashcardQuestion {
    mode: 'flashcard';
    word: string;
    phonetic?: string;
    hint?: string;
}
export interface TypeAnswerQuestion {
    mode: 'type_answer';
    translation: string;
    prompt: string;
    languageCode: string;
}
export interface ReverseQuestion {
    mode: 'reverse';
    translation: string;
    options: string[];
    correctAnswer: string;
}
export interface ListeningQuestion {
    mode: 'listening';
    audioText: string;
    lang: string;
    options: string[];
    correctAnswer: string;
}
export interface ContextQuestion {
    mode: 'context';
    sentence: string;
    blankPosition: number;
    options: string[];
    correctAnswer: string;
}
export interface SentenceQuestion {
    mode: 'sentence';
    words: string[];
    correctSentence: string;
    prompt: string;
}
export type QuestionPayload = FlashcardQuestion | TypeAnswerQuestion | ReverseQuestion | ListeningQuestion | ContextQuestion | SentenceQuestion;
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export interface UserProfile {
    id: string;
    email: string;
    displayName: string;
    nativeLanguageCode: string;
    nativeLanguageName: string;
    timezone: string;
    dailyGoal: number;
    totalXp: number;
    currentStreak: number;
    learningLanguages: {
        code: string;
        name: string;
        nativeName: string;
        currentCefrLevel: string;
        targetCefrLevel: string;
        isPrimary: boolean;
    }[];
}
export interface LanguageDto {
    id: string;
    code: string;
    name: string;
    nativeName: string;
    rtl?: boolean;
    flagEmoji?: string | null;
}
export interface RetentionRateDto {
    total: number;
    passed: number;
    retentionPercent: number;
}
export interface HeatmapEntry {
    date: string;
    count: number;
}
export interface VelocityEntry {
    week: string;
    wordsLearned: number;
}
export interface GamificationStats {
    currentStreak: number;
    longestStreak: number;
    streakFreezes: number;
    totalXp: number;
    weeklyXp: number;
    level: number;
    xpInLevel: number;
    xpForNextLevel: number;
    dailyXp: number;
    dailyGoal: number;
    dailyProgressPercent: number;
    isDailyGoalReached: boolean;
    totalWordCount: number;
    masteredWordCount: number;
    badges: {
        badge: string;
        description: string;
        earnedAt: string;
    }[];
}
export interface WeeklyLeaderboardEntry {
    rank: number;
    displayName: string;
    weeklyXp: number;
    isMe: boolean;
}
export interface WeeklyLeaderboardResponse {
    items: WeeklyLeaderboardEntry[];
    me: WeeklyLeaderboardEntry | null;
    resetAt: string;
}
export interface RoadmapRecommendation {
    cefrLevel: CefrLevel;
    wordsRequired: number;
    wordsLearned: number;
    progressPercent: number;
    suggestedSkillFocus: string;
    isCurrentLevel: boolean;
    isCompleted: boolean;
}
