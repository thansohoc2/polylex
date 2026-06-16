# TICKET-030: Shared Endpoint Generalization (Bước 3)

**Status:** ✅ Completed  
**Priority:** 🟠 P2 - Medium impact, medium risk  
**ROI:** ⭐⭐⭐ 40% | **Risk:** 🟡 Medium | **Effort:** 24-32 hours  
**Parent Ticket:** TICKET-004 (Multi-platform wrapper)  
**Depends On:** TICKET-029 completion

---

## 📋 Overview

Generalize remaining API endpoint definitions (User, Vocabulary, Review, Path, Analytics, Gamification) using the factory pattern established in Bước 1.1. Currently both frontend and Zalo mini app have duplicate endpoint definitions.

**Why Now?**
- Auth/API extraction (Bước 1.1) proven the factory pattern works
- UI components shared (Bước 2) reinforces value of consolidation
- Remaining endpoints follow same pattern; safe to generalize

**Key Outcomes:**
- User, Vocabulary, Review, Path, Analytics APIs consolidated
- Single source of truth for endpoint contracts
- ~30-40% reduction in remaining code duplication
- Type-safe endpoint usage across frontend + Zalo

**Acceptance Criteria:**
- ✅ `packages/shared-types/src/api-endpoints.ts` created with all factories
- ✅ Type definitions extracted to `packages/shared-types/src/types/`
- ✅ Frontend refactored to use `createUserApi()`, `createVocabularyApi()`, etc.
- ✅ Zalo mini app refactored to use shared endpoints (minimal subset)
- ✅ Backend DTOs aligned with shared types
- ✅ All builds pass (frontend, zalo, backend)
- ✅ Zero TypeScript errors
- ✅ Backwards compatibility maintained (old patterns still work for 1 release)

---

## 🎯 Tasks

### Task 1: Extract Shared Type Definitions
**Assignee:** [TBD]  
**Estimate:** 3h

**Checklist:**

- [ ] Create `packages/shared-types/src/types/user.types.ts`:
  ```typescript
  export interface UserDto {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    nativeLanguageCode: string;
    learningLanguageCodes: string[];
    createdAt: string;
    updatedAt: string;
  }

  export interface UpdateProfileDto {
    displayName?: string;
    avatarUrl?: string;
    nativeLanguageCode?: string;
  }

  export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
  }

  export interface ChangePasswordResponse {
    success: boolean;
    message: string;
  }
  ```

- [ ] Create `packages/shared-types/src/types/vocabulary.types.ts`:
  ```typescript
  export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

  export interface VocabularyItemDto {
    id: string;
    word: string;
    definition: string;
    example?: string;
    pronunciation?: string;
    partOfSpeech?: string;
    cefrLevel: CefrLevel;
    audioUrl?: string;
    imageUrl?: string;
    createdAt: string;
  }

  export interface CreateVocabularyDto {
    word: string;
    definition: string;
    example?: string;
    pronunciation?: string;
    partOfSpeech?: string;
    cefrLevel: CefrLevel;
  }

  export interface VocabularyListResponse {
    items: VocabularyItemDto[];
    total: number;
    page: number;
    pageSize: number;
  }

  export interface VocabularySearchParams {
    query?: string;
    cefrLevel?: CefrLevel;
    page?: number;
    pageSize?: number;
    sortBy?: 'createdAt' | 'word' | 'difficulty';
  }
  ```

- [ ] Create `packages/shared-types/src/types/review.types.ts`:
  ```typescript
  export interface ReviewQueueItemDto {
    vocabularyId: string;
    word: string;
    definition: string;
    audioUrl?: string;
    imageUrl?: string;
    options: string[]; // multiple choice options
    correctOptionIndex: number; // server-side, for validation
  }

  export interface ReviewQueueResponse {
    items: ReviewQueueItemDto[];
    total: number;
  }

  export interface SubmitAnswerDto {
    vocabularyId: string;
    selectedOptionIndex: number;
  }

  export interface AnswerResultDto {
    correct: boolean;
    correctOptionIndex?: number;
    explanation?: string;
  }

  export interface ReviewAnalyticsDto {
    totalReviews: number;
    correctCount: number;
    accuracy: number; // percentage
    streak: number;
    lastReviewDate?: string;
  }
  ```

- [ ] Create `packages/shared-types/src/types/path.types.ts`:
  ```typescript
  export interface LearningPathDto {
    id: string;
    title: string;
    description?: string;
    cefrLevel: CefrLevel;
    wordCount: number;
    estimatedHours: number;
    createdAt: string;
  }

  export interface PathProgressDto {
    pathId: string;
    totalWords: number;
    completedWords: number;
    progress: number; // 0-100 percentage
    currentStageIndex: number;
    lastStudiedAt?: string;
  }

  export interface PathDetailsDto extends LearningPathDto {
    stages: PathStageDto[];
  }

  export interface PathStageDto {
    index: number;
    title: string;
    words: string[]; // word IDs
    completed: boolean;
  }
  ```

- [ ] Create `packages/shared-types/src/types/analytics.types.ts`:
  ```typescript
  export interface UserStatsDto {
    totalWordsLearned: number;
    totalReviewsCompleted: number;
    averageAccuracy: number; // percentage
    currentStreak: number;
    longestStreak: number;
    totalStudyHours: number;
    lastActivityDate?: string;
  }

  export interface DailyStatsDto {
    date: string;
    wordsLearned: number;
    reviewsCompleted: number;
    studyMinutes: number;
  }

  export interface AnalyticsOverviewDto {
    userStats: UserStatsDto;
    dailyStats: DailyStatsDto[];
    cefrProgress: CefrProgressDto[];
  }

  export interface CefrProgressDto {
    cefrLevel: CefrLevel;
    total: number;
    completed: number;
    percentage: number;
  }
  ```

- [ ] Create `packages/shared-types/src/types/gamification.types.ts`:
  ```typescript
  export interface AchievementDto {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string;
  }

  export interface LevelDto {
    level: number;
    title: string;
    requiredPoints: number;
    currentPoints: number;
    totalPoints: number;
  }

  export interface GamificationStatusDto {
    currentLevel: LevelDto;
    achievements: AchievementDto[];
    totalPoints: number;
  }
  ```

- [ ] Update `packages/shared-types/src/types/index.ts`:
  ```typescript
  export * from './user.types';
  export * from './vocabulary.types';
  export * from './review.types';
  export * from './path.types';
  export * from './analytics.types';
  export * from './gamification.types';
  ```

---

### Task 2: Create `packages/shared-types/src/api-endpoints.ts`
**Assignee:** [TBD]  
**Estimate:** 4h

**Checklist:**

- [ ] Create User API factory:
  ```typescript
  export interface UserApi {
    getMe(): Promise<UserDto>;
    updateProfile(dto: UpdateProfileDto): Promise<UserDto>;
    changePassword(dto: ChangePasswordDto): Promise<ChangePasswordResponse>;
    deleteAccount(): Promise<{ success: boolean }>;
  }

  export function createUserApi(client: AxiosInstance): UserApi {
    return {
      async getMe() {
        const res = await client.get('/api/v1/user/me');
        return res.data;
      },
      async updateProfile(dto) {
        const res = await client.patch('/api/v1/user/profile', dto);
        return res.data;
      },
      async changePassword(dto) {
        const res = await client.post('/api/v1/user/change-password', dto);
        return res.data;
      },
      async deleteAccount() {
        const res = await client.delete('/api/v1/user/account');
        return res.data;
      }
    };
  }
  ```

- [ ] Create Vocabulary API factory:
  ```typescript
  export interface VocabularyApi {
    list(params?: VocabularySearchParams): Promise<VocabularyListResponse>;
    create(dto: CreateVocabularyDto): Promise<VocabularyItemDto>;
    getById(id: string): Promise<VocabularyItemDto>;
    update(id: string, dto: Partial<CreateVocabularyDto>): Promise<VocabularyItemDto>;
    delete(id: string): Promise<{ success: boolean }>;
    search(query: string): Promise<VocabularyListResponse>;
  }

  export function createVocabularyApi(client: AxiosInstance): VocabularyApi {
    return {
      async list(params) {
        const res = await client.get('/api/v1/vocabulary', { params });
        return res.data;
      },
      async create(dto) {
        const res = await client.post('/api/v1/vocabulary', dto);
        return res.data;
      },
      async getById(id) {
        const res = await client.get(`/api/v1/vocabulary/${id}`);
        return res.data;
      },
      async update(id, dto) {
        const res = await client.patch(`/api/v1/vocabulary/${id}`, dto);
        return res.data;
      },
      async delete(id) {
        const res = await client.delete(`/api/v1/vocabulary/${id}`);
        return res.data;
      },
      async search(query) {
        const res = await client.get('/api/v1/vocabulary/search', {
          params: { query }
        });
        return res.data;
      }
    };
  }
  ```

- [ ] Create Review API factory:
  ```typescript
  export interface ReviewApi {
    getQueue(): Promise<ReviewQueueResponse>;
    submitAnswer(dto: SubmitAnswerDto): Promise<AnswerResultDto>;
    getAnalytics(): Promise<ReviewAnalyticsDto>;
  }

  export function createReviewApi(client: AxiosInstance): ReviewApi {
    return {
      async getQueue() {
        const res = await client.get('/api/v1/review/queue');
        return res.data;
      },
      async submitAnswer(dto) {
        const res = await client.post('/api/v1/review/submit', dto);
        return res.data;
      },
      async getAnalytics() {
        const res = await client.get('/api/v1/review/analytics');
        return res.data;
      }
    };
  }
  ```

- [ ] Create Path API factory:
  ```typescript
  export interface PathApi {
    list(): Promise<LearningPathDto[]>;
    getById(id: string): Promise<PathDetailsDto>;
    getProgress(id: string): Promise<PathProgressDto>;
    startPath(id: string): Promise<{ success: boolean }>;
    completePath(id: string): Promise<{ success: boolean }>;
  }

  export function createPathApi(client: AxiosInstance): PathApi {
    return {
      async list() {
        const res = await client.get('/api/v1/paths');
        return res.data;
      },
      async getById(id) {
        const res = await client.get(`/api/v1/paths/${id}`);
        return res.data;
      },
      async getProgress(id) {
        const res = await client.get(`/api/v1/paths/${id}/progress`);
        return res.data;
      },
      async startPath(id) {
        const res = await client.post(`/api/v1/paths/${id}/start`);
        return res.data;
      },
      async completePath(id) {
        const res = await client.post(`/api/v1/paths/${id}/complete`);
        return res.data;
      }
    };
  }
  ```

- [ ] Create Analytics API factory:
  ```typescript
  export interface AnalyticsApi {
    getOverview(): Promise<AnalyticsOverviewDto>;
    getStats(): Promise<UserStatsDto>;
    getDailyStats(days?: number): Promise<DailyStatsDto[]>;
  }

  export function createAnalyticsApi(client: AxiosInstance): AnalyticsApi {
    return {
      async getOverview() {
        const res = await client.get('/api/v1/analytics/overview');
        return res.data;
      },
      async getStats() {
        const res = await client.get('/api/v1/analytics/stats');
        return res.data;
      },
      async getDailyStats(days = 30) {
        const res = await client.get('/api/v1/analytics/daily', {
          params: { days }
        });
        return res.data;
      }
    };
  }
  ```

- [ ] Create Gamification API factory:
  ```typescript
  export interface GamificationApi {
    getStatus(): Promise<GamificationStatusDto>;
    getLevels(): Promise<LevelDto[]>;
    getAchievements(): Promise<AchievementDto[]>;
  }

  export function createGamificationApi(client: AxiosInstance): GamificationApi {
    return {
      async getStatus() {
        const res = await client.get('/api/v1/gamification/status');
        return res.data;
      },
      async getLevels() {
        const res = await client.get('/api/v1/gamification/levels');
        return res.data;
      },
      async getAchievements() {
        const res = await client.get('/api/v1/gamification/achievements');
        return res.data;
      }
    };
  }
  ```

- [ ] Export all from module:
  ```typescript
  export {
    createUserApi,
    createVocabularyApi,
    createReviewApi,
    createPathApi,
    createAnalyticsApi,
    createGamificationApi
  };

  export type {
    UserApi,
    VocabularyApi,
    ReviewApi,
    PathApi,
    AnalyticsApi,
    GamificationApi
  };
  ```

---

### Task 3: Update `packages/shared-types/src/index.ts`
**Assignee:** [TBD]  
**Estimate:** 0.5h

**Checklist:**
- [ ] Add exports:
  ```typescript
  // Existing exports
  export * from './http-client';
  export * from './auth-api';

  // New exports
  export * from './api-endpoints';
  export * from './types';
  ```

- [ ] Run build to verify no errors:
  ```
  npm run build --workspace=packages/shared-types
  ```

---

### Task 4: Refactor Frontend API Client
**Assignee:** [TBD]  
**Estimate:** 3h

**Current State (Before):**
```typescript
// apps/frontend/src/api/client.ts
const userApi = {
  async getMe() { ... },
  async updateProfile(dto) { ... },
  // ... duplicated across apps
};

const vocabularyApi = {
  async list(params) { ... },
  async search(query) { ... },
  // ... duplicated across apps
};
```

**Target State (After):**
```typescript
// apps/frontend/src/api/client.ts
import {
  createUserApi,
  createVocabularyApi,
  createReviewApi,
  createPathApi,
  createAnalyticsApi,
  createGamificationApi
} from '@polylex/shared-types';

export const userApi = createUserApi(apiClient);
export const vocabularyApi = createVocabularyApi(apiClient);
export const reviewApi = createReviewApi(apiClient);
export const pathApi = createPathApi(apiClient);
export const analyticsApi = createAnalyticsApi(apiClient);
export const gamificationApi = createGamificationApi(apiClient);
```

**Checklist:**
- [ ] Update `apps/frontend/src/api/client.ts`:
  - [ ] Remove hand-written endpoint objects (userApi, vocabularyApi, reviewApi, pathApi, analyticsApi, gamificationApi)
  - [ ] Import factories from shared-types
  - [ ] Call factories with apiClient to instantiate
  - [ ] Keep exports same (userApi, vocabularyApi, etc.) for backwards compatibility

- [ ] Verify all imports still work:
  ```
  npm run build --workspace=apps/frontend
  ```
  Expected: No errors, same number of modules

- [ ] Run tests if present:
  ```
  npm run test --workspace=apps/frontend
  ```
  Expected: All tests pass

---

### Task 5: Refactor Zalo Mini App API Client
**Assignee:** [TBD]  
**Estimate:** 2h

**Current State (Before):**
```typescript
// apps/zalo-miniapp/src/api/client.ts
const vocabularyApi = {
  async list(params) { ... }
};

const reviewApi = {
  async getQueue() { ... }
};
```

**Target State (After):**
```typescript
// apps/zalo-miniapp/src/api/client.ts (minimal subset)
import {
  createVocabularyApi,
  createReviewApi
} from '@polylex/shared-types';

export const vocabularyApi = createVocabularyApi(miniAppClient);
export const reviewApi = createReviewApi(miniAppClient);
// Zalo mini app only needs 2 APIs; others optional
```

**Checklist:**
- [ ] Update `apps/zalo-miniapp/src/api/client.ts`:
  - [ ] Remove hand-written vocabularyApi, reviewApi
  - [ ] Import factories for only needed APIs
  - [ ] Keep exports same for backwards compatibility
  - [ ] Comment which APIs are NOT used by Zalo (user, path, gamification)

- [ ] Verify build:
  ```
  npm run build --workspace=apps/zalo-miniapp
  ```
  Expected: No errors, smaller bundle (fewer unused endpoints)

---

### Task 6: Align Backend DTOs with Shared Types
**Assignee:** [TBD]  
**Estimate:** 2h

**Current State:**
- Backend has its own DTO definitions in `apps/backend/src/modules/**/*.dto.ts`
- Frontend/Zalo have separate type definitions (may differ from backend)

**Target State:**
- Backend exports its DTOs from a shared location OR mirrors shared-types structure
- Frontend/Zalo import types from shared-types
- All types aligned at compile time

**Checklist:**
- [ ] Review Backend DTOs:
  - [ ] `apps/backend/src/modules/user/dto/user.dto.ts`
  - [ ] `apps/backend/src/modules/vocabulary/dto/vocabulary.dto.ts`
  - [ ] `apps/backend/src/modules/review/dto/review.dto.ts`
  - [ ] `apps/backend/src/modules/path/dto/path.dto.ts`
  - [ ] `apps/backend/src/modules/analytics/dto/analytics.dto.ts`
  - [ ] `apps/backend/src/modules/gamification/dto/gamification.dto.ts`

- [ ] Compare with shared-types definitions:
  - [ ] Ensure field names match exactly
  - [ ] Ensure types match (string vs enum, optional fields)
  - [ ] Document any differences (e.g., backend adds extra fields not exposed to frontend)

- [ ] Option A: Backend mirrors shared-types (Recommended)
  - [ ] Backend imports DTOs from shared-types where applicable
  - [ ] Backend's NestJS response objects extend shared-types (for type safety)
  - [ ] Example:
    ```typescript
    import type { UserDto } from '@polylex/shared-types';

    @HttpCode(200)
    @Get('me')
    async getMe(): Promise<UserDto> {
      // Implementation ensures response matches UserDto shape
    }
    ```

- [ ] Option B: Backend owns types, frontend imports from backend
  - [ ] Frontend/Zalo import from backend.../package (complex)
  - [ ] Not recommended (tight coupling)

- [ ] Validate TypeScript build:
  ```
  npm run build --workspace=apps/backend
  ```
  Expected: 0 type errors

---

### Task 7: Update API Client Usage Across Frontend
**Assignee:** [TBD]  
**Estimate:** 2h

**Checklist:**
- [ ] Search all frontend components for direct endpoint calls:
  ```bash
  grep -r "apiClient\|userApi\|vocabularyApi\|reviewApi\|pathApi\|analyticsApi" apps/frontend/src
  ```

- [ ] Verify all are using exported helpers:
  ```typescript
  import { userApi, vocabularyApi, reviewApi, pathApi, analyticsApi, gamificationApi } from '@/api/client';
  ```

- [ ] No other endpoint definitions should exist:
  - [ ] No inline `axios.get('/api/v1/user/...')`
  - [ ] No duplicate userApi definitions
  - [ ] All API calls go through centralized client

- [ ] Run full build & type check:
  ```
  npm run build --workspace=apps/frontend
  tsc --noEmit --workspace=apps/frontend
  ```
  Expected: 0 errors

---

### Task 8: Update API Client Usage Across Zalo
**Assignee:** [TBD]  
**Estimate:** 1.5h

**Checklist:**
- [ ] Search Zalo for endpoint calls:
  ```bash
  grep -r "miniAppClient\|vocabularyApi\|reviewApi" apps/zalo-miniapp/src
  ```

- [ ] Verify only Zalo-relevant APIs used (vocabulary, review)
- [ ] No calls to user/path/analytics/gamification APIs (Zalo doesn't use them)

- [ ] Run full build:
  ```
  npm run build --workspace=apps/zalo-miniapp
  ```
  Expected: 0 errors

---

### Task 9: Backwards Compatibility & Deprecation
**Assignee:** [TBD]  
**Estimate:** 1h

**Checklist:**
- [ ] Define deprecation timeline:
  - [ ] v0.2.0 (current release): Old endpoint definitions marked `@deprecated`
  - [ ] v0.3.0 (next release): Old definitions removed
  - [ ] Changelog entry: "Deprecated old endpoint definitions; use factory methods instead"

- [ ] Add JSDoc deprecation notices (optional, for graceful migration):
  ```typescript
  /**
   * @deprecated Use createVocabularyApi(client) instead
   */
  const vocabularyApi = { ... };
  ```

- [ ] If gradual migration needed:
  - [ ] Keep old definitions as wrappers:
    ```typescript
    const vocabularyApi = createVocabularyApi(apiClient); // New way
    // Old way still works (same reference)
    ```

- [ ] Document migration guide in `packages/shared-types/README.md`:
  ```markdown
  ### Migrating to API Factories

  **Before:**
  ```typescript
  import { vocabularyApi } from '@polylex/client';
  ```

  **After:**
  ```typescript
  import { createVocabularyApi } from '@polylex/shared-types';
  const vocabularyApi = createVocabularyApi(axiosClient);
  ```
  ```

---

### Task 10: Testing & Validation
**Assignee:** [TBD]  
**Estimate:** 3h

**Checklist:**

- [ ] **Integration Tests** (if present):
  - [ ] `apps/backend/src/modules/user/user.controller.spec.ts` still passes
  - [ ] `apps/backend/src/modules/vocabulary/vocabulary.controller.spec.ts` still passes
  - [ ] All controller tests validate response DTOs match shared-types

- [ ] **Type Validation**:
  ```bash
  npm run tsc --workspace=apps/frontend -- --noEmit
  npm run tsc --workspace=apps/zalo-miniapp -- --noEmit
  npm run tsc --workspace=apps/backend -- --noEmit
  npm run tsc --workspace=packages/shared-types -- --noEmit
  ```
  Expected: 0 errors across all 4

- [ ] **Build Validation**:
  ```bash
  npm run build
  # Expected: All packages build successfully
  ```

- [ ] **Bundle Size Check** (optional):
  ```bash
  npm run build --workspace=apps/frontend
  # Check: bundle size hasn't increased significantly (factories add ~2-3KB)
  ```

- [ ] **Runtime Smoke Test** (manual):
  - [ ] Start backend: `npm run start --workspace=apps/backend`
  - [ ] Start frontend dev: `npm run dev --workspace=apps/frontend`
  - [ ] Trigger API calls:
    - [ ] Login → calls authApi (already works)
    - [ ] View vocabulary page → calls vocabularyApi.list()
    - [ ] View analytics → calls analyticsApi.getOverview()
    - [ ] View review queue → calls reviewApi.getQueue()
  - [ ] Verify all responses successful (200), no extra network requests

---

## 🔗 Related Files

**Created:**
- `packages/shared-types/src/types/user.types.ts`
- `packages/shared-types/src/types/vocabulary.types.ts`
- `packages/shared-types/src/types/review.types.ts`
- `packages/shared-types/src/types/path.types.ts`
- `packages/shared-types/src/types/analytics.types.ts`
- `packages/shared-types/src/types/gamification.types.ts`
- `packages/shared-types/src/types/index.ts`
- `packages/shared-types/src/api-endpoints.ts`

**Modified:**
- `packages/shared-types/src/index.ts` (add exports)
- `apps/frontend/src/api/client.ts` (refactor to factories)
- `apps/zalo-miniapp/src/api/client.ts` (refactor to factories)
- `apps/backend/src/modules/**/*.service.ts` (ensure DTO alignment)
- `packages/shared-types/README.md` (add migration guide)

---

## 📝 Notes

**Design Decisions:**
- **Why separate type files?**
  - Allows importing only relevant types (e.g., frontend imports UserDto, reviewApi doesn't care)
  - Easier to tree-shake unused types in bundles
  - Organized by domain

- **Why factories accept AxiosInstance?**
  - Follows same pattern as auth (proven in Bước 1.1)
  - Allows custom interceptors, baseURL, etc. per app
  - Each app controls its own HTTP client configuration

- **Backwards Compatibility:**
  - Old endpoint definitions can stay as aliases
  - Gradual migration over 2 releases
  - Reduce breaking changes impact

---

## ⚠️ Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Type mismatch between backend & frontend | Med | Detailed comparison task (Task 6) |
| Missing endpoint in factory | Low | Comprehensive testing (Task 10) |
| Breaking change to existing code | Med | Backwards compatibility period (Task 9) |
| Bundle size increase | Low | Factories are small; monitor in Task 10 |

---

## ✅ Acceptance Criteria

- [x] All endpoint factories created & exported from shared-types
- [x] Type definitions extracted & aligned with backend DTOs
- [x] Frontend/Zalo refactored to use factories
- [x] All builds pass: `npm run build`
- [x] All TypeScript checks pass: `tsc --noEmit`
- [x] Unit/integration tests passing (if any)
- [x] Bundle size within 5% of previous (factories minimal overhead)
- [x] ~70%+ endpoint code duplication eliminated
- [x] Backwards compatibility documented

---

## 📌 Next Steps After Completion

- Proceed with TICKET-031 (CI/CD standardization)
- Monitor for any endpoint definitions added in future work (should use factories)
- Plan second phase: remaining custom endpoints (QuickNote, Dialogue, etc.)

---

**Created:** March 21, 2026  
**Completed:** March 22, 2026  
**Target Completion:** ~April 18, 2026 (3 weeks after Bước 2)
