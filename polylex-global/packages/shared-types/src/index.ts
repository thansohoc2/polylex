/**
 * Shared Type Definitions for Polylex Global
 *
 * Central export hub for all TypeScript types, interfaces, and constants used
 * across the Polylex Global platform:
 * - **Frontend (Web)**: React/Vite Vue components and stores
 * - **Mobile (Zalo/Capacitor)**: Mini-app and native app UI
 * - **Backend (NestJS)**: API services and domain entities
 *
 * This package ensures compile-time type safety and runtime consistency across
 * all client and server layers. All types are:
 * - Serializable (safe for JSON/Protobuf/HTTP transmission)
 * - Backend-agnostic (no async operations or side effects)
 * - Framework-independent (work with any HTTP client, state manager, or UI lib)
 *
 * ## Type Organization
 *
 * - **Review Modes** (`flashcard`, `type_answer`, etc.): User interaction patterns
 * - **ACRE Engine** (Adaptive Cognitive Reinforcement): Spaced repetition algorithm
 * - **Skills & Levels** (CEFR A1-C2): Language proficiency classification
 * - **Questions**: Structured data for review exercises (6 modes)
 * - **API Responses**: Pagination, auth tokens, user profiles, stats
 * - **HTTP & Auth**: Client setup and endpoint contracts (see http-client.ts, auth-api.ts)
 *
 * @module @polylex/shared-types
 *
 * @example
 * ```typescript
 * // Frontend
 * import { ReviewMode, AcreOutput, UserProfile } from '@polylex/shared-types';
 * import { createAuthApi, createApiClientWithAuth } from '@polylex/shared-types';
 *
 * const httpClient = createApiClientWithAuth({
 *   baseURL: 'http://localhost:3000/api/v1',
 * });
 * const authApi = createAuthApi(httpClient);
 *
 * // Backend
 * import { QuestionPayload, PaginatedResponse } from '@polylex/shared-types';
 *
 * type ReviewQuestion = QuestionPayload;
 * type ApiResponse<T> = PaginatedResponse<T>;
 * ```
 */

/**
 * Available learning modes for vocabulary review exercises.
 *
 * Each mode represents a different cognitive challenge:
 * - **flashcard**: Passive recall (show foreign word, recall native meaning)
 * - **type_answer**: Active typing (user types translation from native prompt)
 * - **reverse**: Recognition (native → choose from options)
 * - **listening**: Audio comprehension (hear audio → choose translation)
 * - **context**: Inference (fill blank in sentence with word)
 * - **sentence**: Ordering (arrange words into correct sentence order)
 *
 * Used by ACRE engine to recommend next review mode based on performance.
 *
 * @typedef {string} ReviewMode
 * @enum {'flashcard'|'type_answer'|'reverse'|'listening'|'context'|'sentence'}
 */
// ─── Review Mode ────────────────────────────────────────────────────────────
export type ReviewMode =
  | 'flashcard'
  | 'type_answer'
  | 'reverse'
  | 'listening'
  | 'context'
  | 'sentence';

// ─── ACRE (Adaptive Cognitive Reinforcement Engine) ─────────────────────────
/**
 * Input metrics for the ACRE spaced-repetition algorithm.
 *
 * ACRE uses these metrics to calculate optimal review intervals and detect
 * "leech words" (consistently difficult items). All values are from a single
 * user's self-reported response to a review exercise.
 *
 * @interface AcreInput
 *
 * @example
 * ```typescript
 * const input: AcreInput = {
 *   recallQuality: 4,        // User rated their response as "mostly correct"
 *   responseTimeMs: 1500,    // Took 1.5 seconds to respond
 *   confidenceLevel: 3,      // User felt medium confidence (not sure)
 *   memoryStrength: 0.65,    // Previously 65% learned
 *   leechScore: 1,           // Failed once before (not a leech yet)
 *   difficultyUser: 0.6,     // User adjusted difficulty to 60% (moderate)
 *   reviewMode: 'flashcard', // Tested with flashcard mode
 *   reviewCount: 5,          // User has reviewed this word 5 times total
 *   currentIntervalDays: 3,  // Currently scheduled every 3 days
 * };
 *
 * const output = acreEngine.calculate(input);
 * // output: { newMemoryStrength: 0.75, intervalDays: 7, ... }
 * ```
 *
 * @remarks
 * - **Recall Quality (0-5)**: 0 = blank/wrong, 5 = instant/perfect. Impacts strength gain.
 * - **Response Time**: Faster correct responses → higher confidence, may increase interval.
 * - **Confidence (1-5)**: Self-assessed certainty. Low + high recallQuality = suspicious.
 * - **Memory Strength [0,1]**: Running average of past success. Used to predict next interval.
 * - **Leech Score**: Increments on fail, resets on success. ≥8 marks word as leech.
 * - **Difficulty [0,1]**: User's subjective difficulty. Backend may override if outlier.
 * - **Review Mode**: Simpler modes (flashcard) vs harder (sentence). Influences interval.
 * - **Review Count**: Total historical reviews. Provides context for interval scaling.
 * - **Current Interval**: Needed to avoid proposing same interval (would stall learning).
 *
 * @see {@link AcreOutput} for algorithm results
 * @see {@link ReviewMode} for available review modes
 * @see LEECH_THRESHOLD for leech detection cutoff
 */
export interface AcreInput {
  /** Recall quality rated 0-5 (0 = complete blackout, 5 = perfect) */
  recallQuality: number;
  /** Time taken to respond in milliseconds */
  responseTimeMs: number;
  /** User's self-assessed confidence level 1-5 */
  confidenceLevel: number;
  /** Current memory strength [0, 1] */
  memoryStrength: number;
  /** Current leech score (consecutive fails) */
  leechScore: number;
  /** User-adjusted difficulty [0, 1] */
  difficultyUser: number;
  /** Learning mode used for this review */
  reviewMode: ReviewMode;
  /** Total number of times this word has been reviewed */
  reviewCount: number;
  /** Current interval in days (needed for next interval calculation) */
  currentIntervalDays?: number;
}

/**
 * Output result from ACRE spaced-repetition calculation.
 *
 * Backend stores these values back to the user's vocabulary item,
 * and frontend uses them to decide priority of next review session.
 *
 * @interface AcreOutput
 *
 * @example
 * ```typescript
 * const output: AcreOutput = {
 *   newMemoryStrength: 0.75,      // Memory strength increased from 0.65
 *   intervalDays: 7,               // Schedule next review in 7 days
 *   nextReview: new Date('2025-01-27'),  // Exact date of next review
 *   newLeechScore: 0,              // Reset leech score on success
 *   isLeech: false,                // Not a leech (< 8 fails)
 *   recommendedMode: 'context',    // Next time, try context mode
 * };
 *
 * // Store in DB:
 * await vocabulary.update({
 *   memoryStrength: output.newMemoryStrength,
 *   leechScore: output.newLeechScore,
 *   nextReview: output.nextReview,
 * });
 *
 * // Frontend uses to prioritize queue:
 * const urgent = todos.filter(t => t.nextReview < today);
 * const upcoming = todos.filter(t => t.nextReview >= today);
 * ```
 * @remarks
 * - **Memory Strength [0,1]**: Exponential moving average. 1.0 = fully learned.
 * - **Interval Days**: Capped [0, maxInterval] (backend config). Near zero = urgent review.
 * - **Next Review**: Absolute datetime. Useful for UI countdowns ("2 days left").
 * - **Leech Status**: Word marked leech if ≥ LEECH_THRESHOLD (8) consecutive fails.
 *   Leech words may be auto-deprioritized or shown with 1:1 translations only.
 * - **Recommended Mode**: ACRE learns which modes work best for this word.
 *   Frontend may honor or override based on user preference.
 *
 * @see {@link AcreInput} for input metrics
 * @see LEECH_THRESHOLD for leech definition
 */
export interface AcreOutput {
  /** Updated memory strength [0, 1] */
  newMemoryStrength: number;
  /** Number of days until next review */
  intervalDays: number;
  /** Absolute date of next review */
  nextReview: Date;
  /** Updated leech score */
  newLeechScore: number;
  /** Whether word is now a leech (>= 8 consecutive fails) */
  isLeech: boolean;
  /** Recommended review mode for next session */
  recommendedMode: ReviewMode;
}

/**
 * Threshold for marking a word as a "leech" (problem word).
 *
 * A word becomes a leech if the user fails (recallQuality < 2) on 8 or more
 * consecutive reviews without a success in between. Leech words:
 * - May be surfaced with extra context (definition + 1:1 translation only)
 * - Can be deprioritized in review queue
 * - Signal need for user intervention (word may be too hard or ambiguous)
 *
 * @constant {number}
 * @default 8
 *
 * @see {@link AcreInput} for how leechScore increments
 * @see {@link AcreOutput} for isLeech flag
 *
 * @example
 * ```typescript
 * if (acre.newLeechScore >= LEECH_THRESHOLD) {
 *   // Mark word as leech
 *   word.isLeech = true;
 *   // Or suggest to user:
 *   showNotification(`"${word}" is tricky - try with more context!`);
 * }
 * ```
 */
export const LEECH_THRESHOLD = 8;

// ─── Skill Types ──────────────────────────────────────────────────────────
/**
 * Language learning skills that users can develop.
 *
 * These skills are used to:
 * - Determine which practice modes to recommend (mode → skill mapping)
 * - Track user progress and strengths separately per skill
 * - Allow users to focus on specific skill areas (deferred skills)
 *
 * @typedef {string} Skill
 * @enum {'reading'|'listening'|'writing'|'speaking'|'vocabulary'|'grammar'}
 *
 * @example
 * ```typescript
 * // Map review modes to skills
 * const modeToSkill: Record<ReviewMode, Skill> = {
 *   flashcard: 'vocabulary',
 *   type_answer: 'writing',
 *   reverse: 'vocabulary',
 *   listening: 'listening',
 *   context: 'reading',
 *   sentence: 'writing',
 * };
 *
 * // Backend tracks per-skill stats
 * const userVocabSkill = userStats.skillStats.vocabulary;
 * const listeningXp = userStats.skillStats.listening;
 * ```
 *
 * @remarks
 * - **vocabulary**: Core word knowledge (all basic modes)
 * - **reading**: Text comprehension (context, sentence modes)
 * - **writing**: Typing and composition (type_answer, sentence modes)
 * - **listening**: Audio comprehension and pronunciation (listening mode)
 * - **speaking**: Pronunciation and conversation (future modes)
 * - **grammar**: Sentence structure (context, sentence modes)
 */
export type Skill = 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary' | 'grammar';

/**
 * Full list of all available learning skills.
 *
 * Used to iterate over skills when fetching stats, comparing progress, or
 * seeding new user profiles with empty stats for each skill.
 *
 * @constant {Skill[]}
 *
 * @example
 * ```typescript
 * // Initialize empty skill stats for new user
 * const skillStats: Record<Skill, SkillStat> = {};
 * SKILLS.forEach(skill => {
 *   skillStats[skill] = {
 *     xp: 0,
 *     levelPoints: 0,
 *     level: 1,
 *   };
 * });
 *
 * // Loop through all skills in progress dashboard
 * SKILLS.forEach(skill => {
 *   const progress = userProgress[skill];
 *   console.log(`${skill}: ${progress.xp} XP`);
 * });
 * ```
 */
export const SKILLS: Skill[] = ['reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar'];

// ─── CEFR Levels ─────────────────────────────────────────────────────────────
/**
 * European language proficiency levels (CEFR - Common European Framework).
 *
 * Standard classification used globally for language learners:
 * - **A1**: Beginner (survival phrases, basic greetings)
 * - **A2**: Elementary (simple conversations, regular patterns)
 * - **B1**: Intermediate (discussions, ongoing tasks)
 * - **B2**: Upper-Intermediate (fluent, native-like proficiency)
 * - **C1**: Advanced (specialist fields, nuanced expression)
 * - **C2**: Mastery (native speaker level)
 *
 * Users set target CEFR level per learning language. Polylex recommends which
 * level the user is currently at based on vocabulary learned.
 *
 * @typedef {string} CefrLevel
 * @enum {'A1'|'A2'|'B1'|'B2'|'C1'|'C2'}
 *
 * @example
 * ```typescript
 * // User's learning language status
 * const langStatus = {
 *   code: 'ja',
 *   currentCefrLevel: 'A2',   // User is at Elementary level
 *   targetCefrLevel: 'B1',    // User wants Intermediate
 *   progressTowardTarget: 65, // 65% of way from A2 to B1
 * };
 *
 * // Recommend next focus
 * const vocabNeeded = CEFR_VOCABULARY_THRESHOLDS[langStatus.targetCefrLevel];
 * ```
 *
 * @see CEFR_VOCABULARY_THRESHOLDS for vocabulary requirements per level
 */
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/**
 * Vocabulary count thresholds to reach each CEFR level.
 *
 * These thresholds are research-based approximations for each language.
 * A user is considered to have reached a CEFR level when their total
 * vocabulary count exceeds the threshold for that level.
 *
 * @constant {Record<CefrLevel, number>}
 *
 * @remarks
 * - **A1 (500 words)**: Basic conversational survival vocabulary
 * - **A2 (1000 words)**: Elementary school vocabulary in native speaker language
 * - **B1 (2000 words)**: High school vocabulary, conversational fluency
 * - **B2 (4000 words)**: College-educated native speaker (target for fluency)
 * - **C1 (8000 words)**: Advanced professional vocabulary
 * - **C2 (∞)**: Complete vocabulary mastery (unrealistic to measure)
 *
 * @example
 * ```typescript
 * // Calculate progress to CEFR level
 * const userVocabCount = 1500;
 * const targetLevel: CefrLevel = 'B1';
 * const required = CEFR_VOCABULARY_THRESHOLDS[targetLevel]; // 2000
 * const progress = (userVocabCount / required) * 100; // 75%
 *
 * // Find current CEFR level
 * let currentLevel: CefrLevel = 'A1';
 * for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CefrLevel[]) {
 *   if (userVocabCount >= CEFR_VOCABULARY_THRESHOLDS[level]) {
 *     currentLevel = level;
 *   }
 * }
 * ```
 */
export const CEFR_VOCABULARY_THRESHOLDS: Record<CefrLevel, number> = {
  A1: 500,
  A2: 1000,
  B1: 2000,
  B2: 4000,
  C1: 8000,
  C2: Infinity,
};

// ─── Question Format ──────────────────────────────────────────────────────────
/**
 * Flashcard mode: Show foreign word → user recalls native meaning.
 *
 * Simplest, most passive mode. No multiple-choice. User sees the word and tries
 * to remember meaning. Includes optional phonetic guide and hint.
 *
 * @interface FlashcardQuestion
 *
 * @example
 * ```typescript
 * const q: FlashcardQuestion = {
 *   mode: 'flashcard',
 *   word: 'こんにちは',
 *   phonetic: 'konnichi wa',
 *   hint: 'Greeting',
 * };
 * // Frontend shows: こんにちは  [phonetic: konnichi wa]
 * // User recalls: "Hello"
 * ```
 */
export interface FlashcardQuestion {
  mode: 'flashcard';
  word: string;
  phonetic?: string;
  hint?: string;
}

/**
 * Type Answer mode: Given native prompt, user types translation in foreign language.
 *
 * Active production mode. Tests both vocabulary and spelling. Backend must provide
 * language code so frontend can use correct keyboard/IME.
 *
 * @interface TypeAnswerQuestion
 *
 * @example
 * ```typescript
 * const q: TypeAnswerQuestion = {
 *   mode: 'type_answer',
 *   translation: 'Good morning',
 *   prompt: 'おはよう',
 *   languageCode: 'vi',
 * };
 * // Frontend shows: "Type in Vietnamese: Good morning"
 * // User types: "Chào buổi sáng"
 * // Frontend submits user's response for grading
 * ```
 */
export interface TypeAnswerQuestion {
  mode: 'type_answer';
  translation: string;
  prompt: string;
  languageCode: string;
}

/**
 * Reverse mode: Given foreign word, choose native meaning from options.
 *
 * Multiple-choice recognition. Tests passive knowledge. Also called "reverse" because
 * it inverts the normal English→Foreign presentation order.
 *
 * @interface ReverseQuestion
 *
 * @example
 * ```typescript
 * const q: ReverseQuestion = {
 *   mode: 'reverse',
 *   translation: 'Good morning',
 *   options: ['Good morning', 'Good night', 'Good afternoon', 'Good bye'],
 *   correctAnswer: 'Good morning',
 * };
 * // Frontend shows: "おはよう" + 4 options
 * // User selects: "Good morning"
 * ```
 */
export interface ReverseQuestion {
  mode: 'reverse';
  translation: string;
  options: string[];
  correctAnswer: string;
}

/**
 * Listening mode: Hear audio, choose translation from options.
 *
 * Tests listening comprehension. Backend provides audio text (for text-to-speech
 * on frontend or prerecorded URL). Frontend generates audio and plays to user.
 *
 * @interface ListeningQuestion
 *
 * @example
 * ```typescript
 * const q: ListeningQuestion = {
 *   mode: 'listening',
 *   audioText: 'こんにちは',  // Text for TTS or audio URL
 *   lang: 'ja',               // Language for frontend TTS engine
 *   options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'],
 *   correctAnswer: 'Hello',
 * };
 * // Frontend TTS: say "こんにちは" in Japanese
 * // User hears audio, selects: "Hello"
 * ```
 */
export interface ListeningQuestion {
  mode: 'listening';
  audioText: string;
  lang: string;
  options: string[];
  correctAnswer: string;
}

/**
 * Context mode: Sentence with blank, choose word to fill blank.
 *
 * Tests vocabulary in context. User reads a sentence with one word missing
 * (indicated by blank position) and selects the correct word from options.
 *
 * @interface ContextQuestion
 *
 * @example
 * ```typescript
 * const q: ContextQuestion = {
 *   mode: 'context',
 *   sentence: 'こんにちは、[BLANK]です。',
 *   blankPosition: 1,         // Which word is missing (0-indexed)
 *   options: ['私は', 'あなたは', 'これは', 'それは'],
 *   correctAnswer: '私は',
 * };
 * // Frontend shows: "こんにちは、[?] です。" + 4 options
 * // User selects: "私は"
 * ```
 */
export interface ContextQuestion {
  mode: 'context';
  sentence: string;
  blankPosition: number;
  options: string[];
  correctAnswer: string;
}

/**
 * Sentence mode: Arrange words into correct sentence order.
 *
 * Most challenging mode. Tests grammar and word order. User arranges provided
 * words into the correct sequence to form a grammatical sentence.
 *
 * @interface SentenceQuestion
 *
 * @example
 * ```typescript
 * const q: SentenceQuestion = {
 *   mode: 'sentence',
 *   words: ['は', '私', 'です', '学生'],  // Scrambled words
 *   correctSentence: '私は学生です',
 *   prompt: 'Arrange to say "I am a student"',
 * };
 * // Frontend shows: 4 draggable words + "Arrange them"
 * // User arranges: "私" → "は" → "学生" → "です"
 * // Checks against correctSentence
 * ```
 */
export interface SentenceQuestion {
  mode: 'sentence';
  words: string[];
  correctSentence: string;
  prompt: string;
}

/**
 * Union type for any supported question format.
 *
 * Backend generates one of these question types based on vocabulary and
 * user's current skill level. Frontend uses the `mode` discriminant to
 * render the appropriate UI and handle the response.
 *
 * @typedef {union} QuestionPayload
 * @see {@link FlashcardQuestion}
 * @see {@link TypeAnswerQuestion}
 * @see {@link ReverseQuestion}
 * @see {@link ListeningQuestion}
 * @see {@link ContextQuestion}
 * @see {@link SentenceQuestion}
 *
 * @example
 * ```typescript
 * // Backend generates question
 * const q: QuestionPayload = question; // Could be any of the 6 types
 *
 * // Frontend dispatches on mode
 * switch (q.mode) {
 *   case 'flashcard':
 *     showFlashcard(q); break;
 *   case 'type_answer':
 *     showTypingInput(q); break;
 *   case 'listening':
 *     playAudio(q.audioText, q.lang); break;
 *   // ...
 * }
 *
 * // In React with discriminated union:
 * const renderQuestion = (q: QuestionPayload) => {
 *   if (q.mode === 'flashcard') {
 *     return <Flashcard {...q} />;
 *   } else if (q.mode === 'listening') {
 *     return <ListeningQuestion {...q} />;
 *   }
 * };
 * ```
 */
export type QuestionPayload =
  | FlashcardQuestion
  | TypeAnswerQuestion
  | ReverseQuestion
  | ListeningQuestion
  | ContextQuestion
  | SentenceQuestion;

// ─── API Response Shapes ──────────────────────────────────────────────────────
/**
 * Standard pagination wrapper for paginated API responses.
 *
 * Used consistently across all list endpoints (words, paths, users, etc.)
 * to provide uniform pagination metadata. Frontend uses this to implement
 * infinite scroll, pagination controls, or load-more buttons.
 *
 * @interface PaginatedResponse
 * @template T - The type of items in the list
 *
 * @example
 * ```typescript
 * // Get page 2 of user's vocabulary
 * const response = await fetch('/api/v1/vocabularies?page=2&limit=10');
 * const data: PaginatedResponse<VocabularyItem> = await response.json();
 *
 * console.log(data); // {
 * //   items: [{ id: '1', word: '...', ... }, ...],
 * //   total: 250,
 * //   page: 2,
 * //   limit: 10,
 * //   totalPages: 25,
 * // }
 *
 * // Infinite scroll pattern
 * const allItems: VocabularyItem[] = [];
 * for (let page = 1; page <= data.totalPages; page++) {
 *   const chunk = await fetchPage<VocabularyItem>(page);
 *   allItems.push(...chunk.items);
 * }
 * ```
 *
 * @remarks
 * - **items**: Current page's data (typically 10-20 items)
 * - **total**: Total items across all pages (for progress indicators)
 * - **page**: Current page number (1-indexed)
 * - **limit**: Items per page (sent in request)
 * - **totalPages**: Ceiling of total / limit (for UI pagination)
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * JWT token pair for authenticated requests.
 *
 * Returned by login and register endpoints. Frontend stores both tokens
 * and uses accessToken for authorization. RefreshToken used when access
 * token expires (handled by HTTP interceptor).
 *
 * @interface TokenPair
 *
 * @example
 * ```typescript
 * // After login
 * const auth = await authApi.login({ email, password });
 * // auth: { accessToken: 'eyJhbGc...', refreshToken: 'eyJhbGc...' }
 *
 * // Store tokens
 * authStore.setTokens(auth);
 *
 * // HTTP client uses accessToken for Bearer header
 * // And refreshToken when access token expires
 * ```
 *
 * @remarks
 * - Access token: Short-lived (15min-1hr), sent in Authorization header
 * - Refresh token: Long-lived (30 days+), stored securely on client
 * - Both are JWT format (header.payload.signature)
 * - Never send tokens in URL or query string (only Authorization header)
 *
 * @see {@link createApiClientWithAuth} for token-based HTTP client setup
 * @see {@link createAuthApi} for login/register endpoints
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Comprehensive user profile data returned by /me endpoint.
 *
 * Frontend uses this to populate user dashboard, language settings,
 * goals, and learning progress. Returned after login/register or
 * when explicitly fetching current user (/api/v1/users/me).
 *
 * @interface UserProfile
 *
 * @example
 * ```typescript
 * const profile = await userApi.getMe();
 * // {
 * //   id: 'user-uuid',
 * //   email: 'user@example.com',
 * //   displayName: 'Nguyễn Văn A',
 * //   nativeLanguageCode: 'vi',
 * //   nativeLanguageName: 'Tiếng Việt',
 * //   timezone: 'Asia/Ho_Chi_Minh',
 * //   dailyGoal: 100,  // XP per day
 * //   totalXp: 5000,
 * //   currentStreak: 12,  // days
 * //   isOnboarded: true,
 * //   learningLanguages: [
 * //     {
 * //       code: 'ja',
 * //       name: 'Japanese',
 * //       nativeName: '日本語',
 * //       currentCefrLevel: 'A2',
 * //       targetCefrLevel: 'B2',
 * //       isPrimary: true,
 * //     },
 * //     // ... additional languages
 * //   ],
 * // }
 *
 * // In React component
 * const { profile } = useAuth();
 * return (
 *   <div>
 *     <h1>{profile.displayName}</h1>
 *     <p>XP: {profile.totalXp}</p>
 *     <p>Streak: {profile.currentStreak} days</p>
 *     {profile.learningLanguages.map(lang => (
 *       <LanguageCard key={lang.code} lang={lang} />
 *     ))}
 *   </div>
 * );
 * ```
 *
 * @remarks
 * - **id**: User's UUID (unique identifier in backend database)
 * - **email**: Readonly after account creation (primary identifier)
 * - **nativeLanguage**: User's L1 (preferred language for translations)
 * - **timezone**: Used to calculate daily reset times and streak logic
 * - **dailyGoal**: XP target per day (configurable by user)
 * - **currentStreak**: Consecutive days with ≥0 XP (resets to 0 after 1-day gap)
 * - **isOnboarded**: Flag for new-user onboarding flow
 * - **learningLanguages**: List of languages user is actively learning (usually 1-3)
 *   - Each language has own CEFR level, progress, and recommendation
 *   - **isPrimary**: Only one language can be primary (main focus)
 *
 * @see LanguageDto for language structure
 */
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
  isOnboarded: boolean;
  learningLanguages: {
    code: string;
    name: string;
    nativeName: string;
    currentCefrLevel: string;
    targetCefrLevel: string;
    isPrimary: boolean;
  }[];
}

/**
 * Language metadata returned by language catalog endpoints.
 *
 * Used when displaying available languages for user to choose from
 * during onboarding or when adding new learning language.
 *
 * @interface LanguageDto
 *
 * @example
 * ```typescript
 * const languages = await languageApi.list();
 * // [
 * //   {
 * //     id: 'lang-uuid',
 * //     code: 'ja',
 * //     name: 'Japanese',
 * //     nativeName: '日本語',
 * //     rtl: false,
 * //     flagEmoji: '🇯🇵',
 * //   },
 * //   ...
 * // ]
 *
 * // In dropdown
 * return languages.map(lang => (
 * <option key={lang.code}>
 *     {lang.flagEmoji} {lang.name}
 *   </option>
 * ));
 * ```
 *
 * @remarks
 * - **code**: ISO 639-1 language code (ja, vi, en, etc.)
 * - **name**: English name of language (for non-native speakers)
 * - **nativeName**: Name in the language itself (for native speakers)
 * - **rtl**: Right-to-left script (for Arabic, Hebrew, etc.)
 * - **flagEmoji**: Optional emoji flag for UI decoration
 */
export interface LanguageDto {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  rtl?: boolean;
  flagEmoji?: string | null;
}

/**
 * Vocabulary retention metrics for a vocabulary list.
 *
 * Returned by API when fetching stats for a specific vocabulary or module.
 * Frontend uses to show retention rate, pass rate, and learning health.
 *
 * @interface RetentionRateDto
 *
 * @example
 * ```typescript
 * const stats = await vocabularyApi.getStats(vocabularyId);
 * // { total: 100, passed: 75, retentionPercent: 75 }
 *
 * // Show progress bar
 * <div className="progress">
 *   <div style={{ width: stats.retentionPercent + '%' }}>
 *     {stats.passed} / {stats.total}
 *   </div>
 * </div>
 * ```
 */
export interface RetentionRateDto {
  total: number;
  passed: number;
  retentionPercent: number;
}

/**
 * Single heatmap entry for activity visualization.
 *
 * Used in "GitHub-style" heatmap showing user activity (XP, reviews, etc.)
 * over time. Array of these is returned by analytics endpoint.
 *
 * @interface HeatmapEntry
 *
 * @example
 * ```typescript
 * const heatmap = await analyticsApi.getActivityHeatmap(180); // last 180 days
 * // [
 * //   { date: '2025-01-01', count: 0 },
 * //   { date: '2025-01-02', count: 150 },  // 150 XP
 * //   { date: '2025-01-03', count: 200 },
 * //   ...
 * // ]
 *
 * // Render as heatmap
 * <ActivityHeatmap data={heatmap} maxValue={500} />;
 * ```
 */
export interface HeatmapEntry {
  date: string;
  count: number;
}

/**
 * Weekly learning velocity metric.
 *
 * Shows how many words were learned (reached certain retention) in each week.
 * Used to visualize learning pace over time.
 *
 * @interface VelocityEntry
 *
 * @example
 * ```typescript
 * const velocity = await analyticsApi.getWeeklyVelocity();
 * // [
 * //   { week: '2025-W01', wordsLearned: 15 },
 * //   { week: '2025-W02', wordsLearned: 18 },
 * //   { week: '2025-W03', wordsLearned: 12 },
 * // ]
 *
 * // Chart weekly progress
 * <BarChart data={velocity} />;
 * ```
 */
export interface VelocityEntry {
  week: string;
  wordsLearned: number;
}

/**
 * Gamification statistics for user dashboard/profile.
 *
 * Shows streaks, achievements, badges, and overall progress.
 * Motivates users to maintain consistency and meet milestones.
 *
 * @interface GamificationStats
 *
 * @example
 * ```typescript
 * const stats = await userApi.getGamificationStats();
 * // {
 * //   currentStreak: 12,
 * //   longestStreak: 45,
 * //   totalXp: 5000,
 * //   weeklyXp: 450,
 * //   totalWordCount: 250,
 * //   badges: [
 * //     { badge: 'STARTER', description: 'Learn first 10 words', earnedAt: '2025-01-01' },
 * //     { badge: 'WEEK_WARRIOR', description: 'Maintain 7-day streak', earnedAt: '2025-01-15' },
 * //   ],
 * // }
 *
 * // Show achievements
 * <div className="badges">
 *   {stats.badges.map(b => (
 *     <Badge key={b.badge} title={b.description} />
 *   ))}
 * </div>
 * ```
 *
 * @remarks
 * - **Streak**: Consecutive days with ≥1 XP (resets after 1-day gap)
 * - **XP**: Accumulated points from reviews (varies by mode and difficulty)
 * - **Badges**: Achievements earned after hitting milestones
 * - **Weekly XP**: Rolling window of last 7 days (used for leaderboards)
 */
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

/**
 * CEFR level recommendation with progress metrics.
 *
 * Returned by learning path endpoint to show user's current place
 * in the CEFR progression and recommend next steps.
 *
 * @interface RoadmapRecommendation
 *
 * @example
 * ```typescript
 * const roadmap = await learningApi.getRoadmap('ja');
 * // [
 * //   {
 * //     cefrLevel: 'A1',
 * //     wordsRequired: 500,
 * //     wordsLearned: 350,
 * //     progressPercent: 70,
 * //     suggestedSkillFocus: 'vocabulary',
 * //     isCurrentLevel: true,
 * //     isCompleted: false,
 * //   },
 * //   {
 * //     cefrLevel: 'A2',
 * //     wordsRequired: 1000,
 * //     wordsLearned: 0,
 * //     progressPercent: 0,
 * //     suggestedSkillFocus: 'reading',
 * //     isCurrentLevel: false,
 * //     isCompleted: false,
 * //   },
 * // ]
 *
 * // Show roadmap with progress bars
 * <RoadmapView levels={roadmap} />;
 * ```
 *
 * @remarks
 * - **currentLevel**: User's active CEFR level (the one they're working on)
 * - **completed**: Levels where user met vocabulary threshold + skill targets
 * - **suggestedSkillFocus**: ACRE algorithm recommends which skill to prioritize
 */
export interface RoadmapRecommendation {
  cefrLevel: CefrLevel;
  wordsRequired: number;
  wordsLearned: number;
  progressPercent: number;
  suggestedSkillFocus: string;
  isCurrentLevel: boolean;
  isCompleted: boolean;
}

/**
 * Re-export HTTP client factory and auth configuration.
 * @see module:./http-client
 *
 * Provides:
 * - `createApiClientWithAuth()`: Setup Axios with token management
 * - `TokenAdapter`: Auth token read/write contract
 *
 * @example
 * ```typescript
 * import { createApiClientWithAuth, TokenAdapter } from '@polylex/shared-types';
 * const httpClient = createApiClientWithAuth({
 *   baseURL: 'http://localhost:3000/api/v1',
 *   auth: {
 *     getAccessToken: () => localStorage.getItem('accessToken'),
 *     getRefreshToken: () => localStorage.getItem('refreshToken'),
 *     setTokens: (tokens) => { ... },
 *   },
 * });
 * ```
 */
export * from './http-client';

/**
 * Re-export auth API endpoint factory.
 * @see module:./auth-api
 *
 * Provides:
 * - `createAuthApi()`: Setup auth endpoints (register, login, logout, socialLogin)
 * - `AuthApi`, `SocialProvider`, `SocialLoginPayload`: Type contracts
 *
 * @example
 * ```typescript
 * import { createAuthApi } from '@polylex/shared-types';
 * const authApi = createAuthApi(httpClient);
 *
 * const { accessToken, refreshToken } = await authApi.login({
 *   email: 'user@example.com',
 *   password: 'password123',
 * });
 * ```
 */
export * from './auth-api';

/**
 * Re-export shared endpoint factories for user, vocabulary, review, paths,
 * analytics, and gamification domains.
 */
export * from './api-endpoints';

/**
 * Re-export domain-specific endpoint payload/response types.
 */
export * from './types';
