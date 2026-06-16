# Phân Tích Hoàn Thiện Zalo Mini App - polylex-global

**Ngày phân tích:** March 21, 2026  
**Trạng thái hiện tại:** Bước 1.1 ✅ hoàn thành (Auth/API extraction + Zalo SDK profile)  
**Tiến độ:** 40% hoàn thành (1.1 / 3 bước)

---

## 📊 Tóm Tắt Tình Hình Hiện Tại

### Đã Hoàn Thành (Bước 1.1)
- ✅ `createApiClientWithAuth()` factory (shared HTTP client với JWT refresh)
- ✅ `createAuthApi()` factory (consolidated auth endpoints)
- ✅ Zalo SDK profile extraction + fallback auto-registration
- ✅ Backend DTO/service hỗ trợ Zalo profile payload
- ✅ Tất cả build & test pass (15/15 backend tests, frontend ✓, zalo ✓)

**Files Created/Modified:**
- `packages/shared-types/src/http-client.ts` (NEW)
- `packages/shared-types/src/auth-api.ts` (NEW)
- `apps/frontend/src/api/client.ts` (refactored)
- `apps/zalo-miniapp/src/api/client.ts` (refactored)
- `apps/zalo-miniapp/src/lib/zalo-auth.ts` (enhanced)
- `apps/backend/src/modules/auth/*` (DTO/service extended)

---

## 🎯 Công Việc Còn Lại - Theo Thứ Tự ROI

### **Bước 1.2: Consolidate Auth Endpoints (Documentation & Validation)** 
**ROI:** ⭐⭐⭐⭐⭐ (100%) | **Risk:** 🔴 Low | **Effort:** 2-4h

**Mục đích:** Formalize & document Bước 1.1 thành complete pattern; validate end-to-end flow.

**Công việc cụ thể:**
1. **Document Shared Auth Pattern**
   - Create `packages/shared-types/README.md` explaining:
     - `AuthTokenAdapter` interface contract
     - `createApiClientWithAuth()` usage & lifecycle
     - `createAuthApi()` endpoint factory pattern
     - Security model: token verify always server-side, SDK profile fallback only
   - Add JSDoc comments to both factories (parameter descriptions, return types, usage examples)

2. **End-to-End Flow Testing**
   - Manual test: Zalo login → SDK profile → backend auto-register
   - Verify session persistence (Zustand store survives reload)
   - Verify token refresh cycle (access token expires, refresh triggered, retry succeeds)
   - Test error paths: invalid token, network timeout, backend rejection

3. **Export Hygiene**
   - Ensure `packages/shared-types/src/index.ts` re-exports everything needed
   - Validate no circular dependencies (shared-types → apps shouldn't reverse)
   - Update backend imports: prefer relative paths for types, not shared-types dependency

4. **TypeScript Validation**
   - Run `tsc --noEmit` on both apps to validate strict mode
   - Ensure no `any` types; validate interface contracts are strict

**Tickets associados:** None yet (this is part of Bước 1)

---

### **Bước 2: Extract Shared UI Primitives & Hooks**
**ROI:** ⭐⭐⭐⭐ (65%) | **Risk:** 🟡 Medium | **Effort:** 16-24h

**Mục đích:** Consolidate reusable UI patterns (buttons, forms, hooks) to reduce component duplication.

**Công việc cụ thể:**

1. **Create `packages/shared-ui` Structure**
   ```
   packages/shared-ui/
     src/
       hooks/
         useSocialLogin.ts (move from frontend + adapt for Zalo)
         useAuthToken.ts (token persistence wrapper)
         useApi.ts (Axios error handling, loading states)
       components/
         SocialLoginButton.tsx (Google, Apple, Facebook, Zalo variants)
         AuthGuard.tsx (check token, redirect if needed)
         ErrorToast.tsx (standardized error UI)
         LoadingSpinner.tsx (consistent loading indicator)
       types/
         index.ts (export AuthButtonVariant, ErrorToastProps, etc.)
       index.ts (public exports)
     package.json (add React, Zustand as peer dependencies)
     tsconfig.json
   ```

2. **Extract Hooks**
   - `useSocialLogin.ts`: 
     - Frontend has custom Google/Apple/FB OAuth flow
     - Zalo has Zalo SDK flow
     - Create abstraction that accepts `onSuccess(auth)` + `onError(error)` callbacks
     - Internally dispatch frontend OAuth or Zalo SDK based on provider param
     - Return `{ login(provider), loading, error }` interface
   
   - `useAuthToken.ts`:
     - Wrapper around Zustand auth store
     - Methods: `getAccessToken()`, `getRefreshToken()`, `setTokens(pair)`, `clearTokens()`
     - Used as `AuthTokenAdapter` in shared HTTP client
   
   - `useApi.ts`:
     - Standardized error toast on 4xx/5xx responses
     - Retry logic with exponential backoff option
     - Return `{ call, loading, error, reset }` for common patterns

3. **Extract Components**
   - `SocialLoginButton.tsx`: 
     - Props: `provider` ('google'|'apple'|'facebook'|'zalo')`, `onSuccess`, `onError`, `loading`
     - Used by both frontend LoginPage + Zalo LoginPage
     - Provider-specific styling via variant prop
   
   - `AuthGuard.tsx`:
     - HOC wrapper: if no token, show login or redirect
     - Props: `fallback` (redirect path or <LoginPage />)
     - Used to protect vocabulary/review pages
   
   - `ErrorToast.tsx`:
     - Reusable error notification (matches frontend design)
     - Auto-dismiss after 3s or manual close
   
   - `LoadingSpinner.tsx`:
     - Skeleton loader for vocab list, review queue, etc.
     - Props: `size`, `variant` (dots, ring, bars)

4. **Adapt Frontend Components**
   - Move Google/Apple/FB OAuth hooks from `apps/frontend/src/hooks/` → `packages/shared-ui/src/hooks/useSocialLogin.ts`
   - Refactor frontend LoginPage to use `<SocialLoginButton>` from shared
   - Update Zalo LoginPage to use same `<SocialLoginButton provider="zalo">`

5. **Adapt Zalo Components**
   - Zalo mini app UI follows zmp-ui design (Material Design + Zalo branding)
   - Ensure shared components don't break Zalo styling (use CSS modules + Tailwind vars)
   - Zalo-specific overrides: dark mode, Zalo brand colors

6. **Test Shared UI**
   - Storybook setup (optional but recommended) to document `SocialLoginButton`, `ErrorToast`, etc.
   - Unit tests: button click → `onSuccess` called, error scenario → toast shown
   - Integration: frontend + Zalo both render shared button, both flows work

**Files Created:**
- `packages/shared-ui/package.json`
- `packages/shared-ui/src/hooks/useSocialLogin.ts`
- `packages/shared-ui/src/hooks/useAuthToken.ts`
- `packages/shared-ui/src/hooks/useApi.ts`
- `packages/shared-ui/src/components/SocialLoginButton.tsx`
- `packages/shared-ui/src/components/AuthGuard.tsx`
- `packages/shared-ui/src/components/ErrorToast.tsx`
- `packages/shared-ui/src/components/LoadingSpinner.tsx`
- `packages/shared-ui/src/types/index.ts`
- `packages/shared-ui/src/index.ts`
- `packages/shared-ui/tsconfig.json`

**Files Modified:**
- `apps/frontend/src/pages/LoginPage.tsx` (use shared `SocialLoginButton`)
- `apps/frontend/src/hooks/useSocialLogin.ts` (delete, logic moved to shared)
- `apps/zalo-miniapp/src/pages/LoginPage.tsx` (use shared `SocialLoginButton`)
- `package.json` (add shared-ui workspace package)

---

### **Bước 3: Shared Endpoint Generalization (User, Vocabulary, Review, Path)**
**ROI:** ⭐⭐⭐ (40%) | **Risk:** 🟡 Medium | **Effort:** 20-32h

**Mục đích:** Consolidate remaining API endpoint definitions (user, vocabulary, review, path, analytics) để giảm duplication.

**Công việc cụ thể:**

1. **Extend `packages/shared-types/src/api-endpoints.ts`** (NEW)
   - Pattern tương tự `auth-api.ts`
   - Create factories cho mỗi domain:
     - `createUserApi(client)` → `{ getMe(), updateProfile(), changePassword() }`
     - `createVocabularyApi(client)` → `{ list(), create(), update(), delete(), search() }`
     - `createReviewApi(client)` → `{ getQueue(), submitAnswer(), getAnalytics() }`
     - `createPathApi(client)` → `{ list(), getPathDetails(), getPathProgress() }`
     - `createAnalyticsApi(client)` → `{ getStats(), getStreak() }`
     - `createGamificationApi(client)` → `{ getLevels(), getAchievements() }`

2. **Refactor Frontend API Client**
   - Replace hand-written endpoint objects with factories:
     ```typescript
     export const userApi = createUserApi(apiClient);
     export const vocabularyApi = createVocabularyApi(apiClient);
     export const reviewApi = createReviewApi(apiClient);
     export const pathApi = createPathApi(apiClient);
     export const analyticsApi = createAnalyticsApi(apiClient);
     ```

3. **Refactor Zalo API Client**
   - Same pattern; only import relevant apis (Zalo doesn't need analytics/gamification)
   - Minimize bundle size by only pulling needed endpoints

4. **Type Alignment**
   - Move DTO types from backend to `packages/shared-types/src/types/`
   - Ensure backend `VocabularyDto`, `ReviewQueueDto`, etc. match frontend/Zalo expectations
   - No runtime mismatches; all typed at compile time

5. **Backwards Compatibility**
   - Keep old `apiClient.userApi.getMe()` alias pattern working
   - Deprecate but don't remove old object definitions (give 2 versions grace period)

**Files Created:**
- `packages/shared-types/src/api-endpoints.ts`
- `packages/shared-types/src/types/user.types.ts`
- `packages/shared-types/src/types/vocabulary.types.ts`
- `packages/shared-types/src/types/review.types.ts`
- `packages/shared-types/src/types/path.types.ts`
- `packages/shared-types/src/types/analytics.types.ts`
- `packages/shared-types/src/types/gamification.types.ts`

**Files Modified:**
- `apps/frontend/src/api/client.ts` (use new factories)
- `apps/zalo-miniapp/src/api/client.ts` (use new factories, minimal subset)
- `apps/backend/src/modules/**/*.dto.ts` (export shared types)
- `packages/shared-types/src/index.ts` (export api-endpoints + all types)

---

### **Bước 4: CI/CD Standardization**
**ROI:** ⭐⭐ (25%) | **Risk:** 🟢 Very Low | **Effort:** 8-12h

**Mục đích:** Chuẩn hóa CI workflow để test shared packages một lần, app-specific test riêng (avoid redundancy).

**Công việc cụ thể:**

1. **GitHub Actions Workflow Structure** (`.github/workflows/`)
   
   **Pipeline 1: `shared-tests.yml`** (Shared packages validation)
   - Run on: changes to `packages/**` or workflow file
   - Steps:
     - `npm install`
     - `npm run lint --workspace=packages/shared-types`
     - `npm run lint --workspace=packages/shared-ui`
     - `npm run test --workspace=packages/shared-types`
     - `npm run test --workspace=packages/shared-ui` (if tests added)
     - `npm run build --workspace=packages/shared-types`
     - `npm run build --workspace=packages/shared-ui`
   - Output: ✅ passes if all shared packages stable
   
   **Pipeline 2: `frontend-tests.yml`** (Frontend web/iOS)
   - Run on: changes to `apps/frontend/**` or (always) if shared tests pass
   - Steps:
     - `npm install`
     - `npm run test --workspace=apps/frontend` (if tests added)
     - `npm run build --workspace=apps/frontend`
     - `npm run cap:run:ios` (dry-run build check)
   - Output: ✅ web build + iOS build success
   
   **Pipeline 3: `zalo-tests.yml`** (Zalo mini app)
   - Run on: changes to `apps/zalo-miniapp/**` or (always) if shared tests pass
   - Steps:
     - `npm run test --workspace=apps/zalo-miniapp` (if tests added)
     - `npm run build --workspace=apps/zalo-miniapp`
   - Output: ✅ zalo build success
   
   **Pipeline 4: `backend-tests.yml`** (Backend services)
   - Run on: changes to `apps/backend/**`
   - Steps:
     - `npm install`
     - `npm run lint --workspace=apps/backend`
     - `npm run test --workspace=apps/backend -- --runInBand`
   - Output: ✅ all tests pass (15+ tests)
   
   **Pipeline 5: `integration-tests.yml`** (E2E validation)
   - Run on: all passes + manual trigger
   - Steps:
     - Start backend service (Docker or local)
     - Deploy frontend to staging
     - Deploy Zalo mini app to staging
     - Run Playwright/Cypress E2E scenarios:
       - Zalo login → profile fetch → auto-register
       - Frontend login (Google/Apple/FB)
       - Vocabulary CRUD
       - Review queue
   - Output: ✅ end-to-end flows validated

2. **Dependency Graph Validation**
   - Add `npm list` output check: ensure no unexpected dependencies
   - Validate no circular imports (shared types → apps yes; apps → shared-types yes; apps → apps no)

3. **Build Artifact Management**
   - Publish shared packages to npm registry (or internal verdaccio)
   - Frontend/Zalo consume from registry instead of relative paths
   - Enables version pinning + cleaner dependency management

4. **Package.json Workspace Configuration**
   - Already have: `"workspaces": ["apps/*", "packages/*"]`
   - Ensure all 3 apps reference shared packages correctly:
     ```json
     "@polylex/shared-types": "*"
     "@polylex/shared-ui": "*"
     ```

**Files Created:**
- `.github/workflows/shared-tests.yml`
- `.github/workflows/frontend-tests.yml`
- `.github/workflows/zalo-tests.yml`
- `.github/workflows/backend-tests.yml`
- `.github/workflows/integration-tests.yml` (optional, more complex)

**Files Modified:**
- `.github/workflows/main.yml` (replace single sprawling workflow with modular pipelines)

---

## 📈 Phân Tích Chi Ph phí

| Bước | ROI | Risk | Effort | Est. Days | Status |
|------|-----|------|--------|-----------|--------|
| 1.1 (đã làm) | 100% | Low | 12h | 1.5d | ✅ Done |
| 1.2 (Doc + E2E) | 100% | Low | 3h | 0.5d | ⏳ TODO |
| 2 (UI Shared) | 65% | Med | 20h | 2.5d | ⏳ TODO |
| 3 (Endpoints) | 40% | Med | 24h | 3d | ⏳ TODO |
| 4 (CI) | 25% | VLow | 10h | 1.25d | ⏳ TODO |
| **TOTAL** | - | - | **69h** | **8.75d** | **40% done** |

---

## 🎯 Chiến Lược Triển Khai

### Phase 1 (Tuần 1-2): Auth + API Layer [PRIORITY 1]
1. **Bước 1.2**: Consolidate + document auth pattern (2-3d)
   - E2E validation (Zalo login flow, token refresh, error handling)
   - Documentation for future maintainers
   - JSDoc + TypeScript strict mode validation

2. **Bước 3**: Generalize remaining endpoints (3d after 1.2)
   - User, Vocabulary, Review, Path, Analytics APIs
   - Refactor both app clients to use factories
   - Backwards compatible deprecation

**Outcome:** 80% of code duplication eliminated; clean pattern for future endpoints.

### Phase 2 (Tuần 3-4): UI Layer [PRIORITY 2]
1. **Bước 2**: Extract shared UI + hooks (2.5d)
   - Buttons, forms, error handling, auth guards
   - Hooks: `useSocialLogin`, `useAuthToken`, `useApi`
   - Integration with both frontend + Zalo

**Outcome:** Consistent UX across all platforms; single source of truth for design system.

### Phase 3 (Tuần 5): CI + Infrastructure [PRIORITY 3]
1. **Bước 4**: CI/CD standardization (1.25d)
   - Modular GitHub Actions workflows
   - npm registry setup for shared packages
   - Integration test framework

**Outcome:** Faster CI/CD, clearer testing responsibilities, easier debugging.

---

## ⚠️ Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Breaking shared package changes | Med | High | Lock versions in lockfile; test before publish |
| Zalo SDK compatibility | Low | Med | Isolate SDK in adapter layer; mock for tests |
| TypeScript strict mode failures | Low | Med | Add `@typescript-eslint` rules; validateon build |
| CI pipeline flakiness | Low | Med | Use caching, retry logic, timeouts |
| Backwards incompatibility | Med | High | Deprecation period (2 releases), changelog |

---

## ✅ Success Criteria

- **Bước 1.2**: ✓ Documentation complete, E2E flow validated, 0 TypeScript errors
- **Bước 2**: ✓ UI shared across web + Zalo, consistent styling, all tests pass
- **Bước 3**: ✓ 70%+ endpoints consolidated, duplication reduced by factor of 2x
- **Bước 4**: ✓ CI pipelines fully modular, avg pipeline run time <5min, no manual steps

---

## 📝 Next Steps

1. **Immediately (Today):** Create TICKET-028 (recap Bước 1.1 + plan 1.2 validation)
2. **This week:** Complete TICKET-028 (1.2 docs + E2E test)
3. **Next week:** Start TICKET-029 (Bước 2 UI extraction) in parallel with TICKET-030 (Bước 3 endpoints)
4. **Week after:** TICKET-031 (CI standardization)

**Mục tiêu hoàn tất:** End of Month-1 (Early May 2026)

---

*Phân tích này dựa trên kiến trúc hiện tại & best practices cho monorepo polylex-global.*
