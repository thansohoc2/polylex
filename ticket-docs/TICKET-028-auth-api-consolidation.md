# TICKET-028: Auth + API Consolidation (Bước 1.2)

**Status:** 🔵 Ready to Start  
**Priority:** 🔥 P0 - Critical for foundation  
**ROI:** ⭐⭐⭐⭐⭐ 100% | **Risk:** 🟢 Low | **Effort:** 3-4 hours  
**Parent Ticket:** TICKET-004 (Multi-platform wrapper)  
**Depends On:** Completion of Bước 1.1 (DONE)

---

## 📋 Overview

Solidify & document the auth + API extraction work completed in Bước 1.1. This ticket ensures the refactoring is production-ready by:
1. Formalizing the shared auth pattern with comprehensive documentation
2. Validating end-to-end flows (Zalo login → SDK profile → backend auto-register)
3. Ensuring TypeScript strict mode compliance
4. Creating reusable examples for future endpoint extraction

**Acceptance Criteria:**
- ✅ Documentation in `packages/shared-types/README.md` complete + accurate
- ✅ All JSDoc comments added to `http-client.ts` & `auth-api.ts`
- ✅ E2E test scenarios validated (manual or automated)
- ✅ TypeScript strict mode: `tsc --noEmit` passes with 0 errors
- ✅ No circular dependencies detected
- ✅ Backend exports clean (no shared-types dependency)

---

## 🎯 Tasks

### Task 1: Create `packages/shared-types/README.md`
**Assignee:** [TBD]  
**Estimate:** 1.5h

**Checklist:**
- [ ] Write overview section: "Purpose of shared-types, what it exports"
- [ ] Document `AuthTokenAdapter` interface:
  - [ ] Parameter descriptions (getAccessToken, getRefreshToken, onRefreshed, onAuthFailed)
  - [ ] Usage example: Zustand store implementation
  - [ ] Usage example: localStorage implementation
- [ ] Document `createApiClientWithAuth()` factory:
  - [ ] Parameters & return type
  - [ ] Request interceptor lifecycle (attach Bearer token)
  - [ ] Response interceptor lifecycle (auto-refresh 401 logic)
  - [ ] Usage in frontend vs Zalo mini app
  - [ ] Config options (includeAccessTokenInRefreshHeader, contentType)
  - [ ] Error handling & edge cases
- [ ] Document `createAuthApi()` factory:
  - [ ] Available methods (register, login, logout, socialLogin)
  - [ ] `SocialLoginPayload` structure
  - [ ] Optional `zaloProfile` fallback behavior
  - [ ] Usage example in both apps
- [ ] Security model section:
  - [ ] "Token always verified server-side first"
  - [ ] "SDK profile used only as fallback for user data"
  - [ ] Developer guidelines: what NOT to do (don't trust SDK profile for auth decisions)
- [ ] Export reference: list all public exports from index.ts
- [ ] Code examples: copy-paste snippets showing common patterns

**Definition of Done:**
- Marketing/communication ready (can share with team)
- New developer can understand pattern without asking questions

---

### Task 2: Add JSDoc Comments to `http-client.ts`
**Assignee:** [TBD]  
**Estimate:** 1h

**Checklist:**
- [ ] Add file-level JSDoc: "Purpose of this module"
- [ ] Document `TokenPairLike` interface:
  ```typescript
  /**
   * Represents access + refresh token pair.
   * @property {string} accessToken - JWT token (typically 15m expiry)
   * @property {string} refreshToken - Refresh token (typically 30d expiry)
   */
  ```
- [ ] Document `AuthTokenAdapter` interface:
  - [ ] All 4 methods with param/return descriptions
  - [ ] Usage notes for implementers
  - [ ] @example showing Zustand store example
- [ ] Document `CreateApiClientWithAuthOptions` type:
  - [ ] All properties with descriptions
  - [ ] Defaults for optional fields
  - [ ] @example for basic setup
- [ ] Document `createApiClientWithAuth()` function:
  - [ ] @param descriptions
  - [ ] @returns description
  - [ ] @throws for error conditions
  - [ ] @example with all use cases (frontend, Zalo, with/without custom headers)
  - [ ] How to handle custom request transformations (headers, timing, etc.)

**Definition of Done:**
- IDE autocomplete shows full JSDoc tooltips
- All functions/types have at least 1-line description
- Examples compile & run without errors

---

### Task 3: Add JSDoc Comments to `auth-api.ts`
**Assignee:** [TBD]  
**Estimate:** 0.5h

**Checklist:**
- [ ] Add file-level JSDoc: "Auth endpoint factory pattern"
- [ ] Document `ZaloProfilePayload` interface:
  - [ ] All optional fields (providerId, displayName, avatarUrl, email)
  - [ ] Where data comes from (Zalo SDK getUserInfo)
  - [ ] Why each field is optional (SDK may not provide all)
- [ ] Document `SocialLoginPayload` interface:
  - [ ] All fields + descriptions
  - [ ] zaloProfile conditional behavior
- [ ] Document `AuthApi` interface:
  - [ ] All method signatures
  - [ ] Return types (Promise<AuthResponseDto>)
  - [ ] Error conditions (400 invalid token, 409 email conflict, etc.)
- [ ] Document `createAuthApi()` function:
  - [ ] @param: Axios instance requirement
  - [ ] @returns: AuthApi interface contract
  - [ ] @example: usage in frontend/Zalo

**Definition of Done:**
- All types/functions properly documented
- Ready for IDE autocompletion users

---

### Task 4: E2E Scenario Validation
**Assignee:** [TBD]  
**Estimate:** 1h

**Test Scenarios (Manual or Automated):**

- [ ] **Scenario 1: Zalo Login → Auto-Register with SDK Profile**
  - Step 1: Open Zalo mini app LoginPage
  - Step 2: Click "Đăng nhập với Zalo"
  - Step 3: `loginWithZaloSdk()` extracts token + profile
  - Step 4: `miniAuthApi.loginWithZalo(token, profile)` called
  - Step 5: Backend receives `SocialLoginDto` with `zaloProfile`
  - Step 6: Backend verifies token, creates user with SDK displayName + email
  - **Expected:** No form submission needed; user auto-logged-in with Zustand auth state set
  - **Validation:** Zustand store has `accessToken`, `refreshToken`, `user.displayName` from SDK

- [ ] **Scenario 2: Token Refresh on 401**
  - Step 1: Make API call with expired access token
  - Step 2: Backend returns 401
  - Step 3: `createApiClientWithAuth()` response interceptor triggers
  - Step 4: Refresh endpoint called with refresh token
  - Step 5: Backend returns new token pair
  - Step 6: Original request retried with new token
  - **Expected:** Seamless refresh; user doesn't see login page
  - **Validation:** No duplicate API calls, original request succeeds

- [ ] **Scenario 3: Refresh Token Expired → Force Login**
  - Step 1: Both access + refresh tokens expired
  - Step 2: API call returns 401
  - Step 3: Refresh call also fails with 401
  - Step 4: `onAuthFailed()` callback triggered
  - Step 5: User redirected to LoginPage
  - **Expected:** User forced to re-authenticate
  - **Validation:** Zustand store cleared, LoginPage shown, no infinite 401 loops

- [ ] **Scenario 4: Session Persists Across Page Reload**
  - Step 1: Login with Zalo → tokens in Zustand + localStorage
  - Step 2: Reload browser tab
  - Step 3: Zustand hydrates from localStorage
  - Step 4: Make API call without re-login
  - **Expected:** API call succeeds (token restored)
  - **Validation:** No 401 on first API call after reload

- [ ] **Scenario 5: Frontend Google OAuth (No Change, But Verify)**
  - Step 1: Login via Google on frontend web
  - Step 2: OAuth popup → Google returns id_token
  - Step 3: `authApi.socialLogin({ provider: 'google', token: id_token })` called
  - Step 4: Backend verifies id_token via Google public key
  - **Expected:** User logged in; Zalo profile payload ignored (not provided)
  - **Validation:** User created without SDK profile fallback needed

**Result Format:**
- Create `TESTING-bước-1.2.md` with screenshot summaries or test logs
- Or update in project's test results folder with timestamp

---

### Task 5: TypeScript Strict Mode Validation
**Assignee:** [TBD]  
**Estimate:** 0.5h

**Checklist:**
- [ ] Run `tsc --noEmit --strict` on `packages/shared-types/`
  - [ ] Expected: 0 errors
  - [ ] If errors: fix type issues in http-client.ts, auth-api.ts
- [ ] Run `tsc --noEmit --strict` on `apps/frontend/`
  - [ ] Expected: 0 errors related to shared auth imports
- [ ] Run `tsc --noEmit --strict` on `apps/zalo-miniapp/`
  - [ ] Expected: 0 errors related to shared auth imports
- [ ] Check `package.json` compilerOptions:
  - [ ] `"strict": true` enabled
  - [ ] `"noImplicitAny": true` enabled
  - [ ] `"noImplicitThis": true` enabled
  - [ ] `"strictNullChecks": true` enabled

**Result:**
```console
$ tsc --noEmit --strict
# Expected output: (no errors)
```

---

### Task 6: Circular Dependency Check
**Assignee:** [TBD]  
**Estimate:** 0.5h

**Checklist:**
- [ ] Install dependency analyzer: `npm install --save-dev dpdm` (or similar)
- [ ] Run: `dpdm apps/frontend/src/index.ts --tree`
  - [ ] Verify: shared-types imports clean (no cycles back to frontend)
- [ ] Run: `dpdm apps/zalo-miniapp/src/index.ts --tree`
  - [ ] Verify: shared-types imports clean
- [ ] Run: `dpdm packages/shared-types/src/index.ts --tree`
  - [ ] Verify: no imports from apps/* (shared should never depend on apps)
- [ ] Manual review: scan for `import from '../../apps'` in shared-types
  - [ ] Expected: 0 found

**Documentation:**
- Add script to `package.json`:
  ```json
  "scripts": {
    "check:circular": "dpdm packages/shared-types/src/index.ts --tree"
  }
  ```

---

### Task 7: Backend Import Cleanup
**Assignee:** [TBD]  
**Estimate:** 0.5h

**Checklist:**
- [ ] Scan backend code for `import from '@polylex/shared-types'`
  - [ ] Backend should NOT depend on shared-types package directly
  - [ ] Types used only locally (dto types defined in backend modules)
- [ ] Verify: shared-types is NOT in `apps/backend/package.json` dependencies
  - [ ] Expected: true (backend owns its type definitions)
- [ ] If types referenced in backend→frontend contract:
  - [ ] Define types in backend only
  - [ ] Frontend/Zalo import types from their own local definitions OR shared-types
  - [ ] Avoid bidirectional dependency

**Outcome:** Clean architecture — shared-types is pull-only, not pushed.

---

## 🔗 Related Files

**Modified in Bước 1.1:**
- `packages/shared-types/src/http-client.ts` (has JSDoc gaps)
- `packages/shared-types/src/auth-api.ts` (has JSDoc gaps)
- `apps/frontend/src/api/client.ts` (uses factories)
- `apps/zalo-miniapp/src/api/client.ts` (uses factories + SDK profile)
- `apps/backend/src/modules/auth/auth.service.ts` (fallback logic)

**New in This Ticket:**
- `packages/shared-types/README.md` (NEW)
- `TESTING-bước-1.2.md` (NEW, optional)
- `packages/shared-types/tsconfig.json` (may need `strict: true` update)

---

## 📝 Notes

**Assumptions:**
- Bước 1.1 work is complete & builds pass
- E2E testing can be done manually (no Playwright setup yet)
- TypeScript v5+ supports JSDoc @example comments

**Risks:**
- If JSDoc examples are complex, may require additional testing time
- E2E scenarios require either local environment or staging deployment

**Next Steps After Completion:**
- Approve TICKET-029 (Bước 2: Shared UI extraction)
- Begin TICKET-030 (Bước 3: Endpoint generalization) in parallel if team size >1

---

## 📌 Acceptance Definition

**Code Review Checklist:**
- [ ] All JSDoc comments are present & grammatically correct
- [ ] README examples compile & conceptually sound
- [ ] TypeScript errors: 0
- [ ] Circular dependencies: 0
- [ ] All E2E scenarios pass (or logged as known issues)
- [ ] Backend imports clean (no unintended shared-types dependency)

**Definition of Done:**
- PR merged to `main`
- Documentation live & reviewable
- All tests green
- Ready to move to Bước 2

---

**Created:** March 21, 2026  
**Target Completion:** March 24, 2026 (3 days)
