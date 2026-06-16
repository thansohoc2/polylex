# Zalo Mini App Completion - Ticket Roadmap & Executive Summary

**Created:** March 21, 2026  
**Status:** 🎯 All tickets ready for implementation  
**Total Scope:** ~69 hours of work  
**Timeline:** 8-10 weeks (May 2026 target completion)

---

## 📊 Executive Overview

### Current State (Bước 1.1 ✅ Complete)
- ✅ Auth interceptor + refresh logic consolidated into `@polylex/shared-types`
- ✅ Auth endpoints factory pattern implemented & working
- ✅ Zalo SDK profile extraction + fallback auto-registration complete
- ✅ Backend tests passing (15/15)
- ✅ Frontend & Zalo builds successful
- **Code Duplication Remaining:** ~70% (UI components, API endpoints, custom hooks)

### Roadmap

| Phase | Bước | ROI | Risk | Effort | Timeline | Ticket |
|-------|------|-----|------|--------|----------|--------|
| ✅ Done | 1.1 | 100% | Low | 12h | 1.5d | - |
| 🔄 Next | 1.2 | 100% | Low | 3h | 0.5d | TICKET-028 |
| 📋 Planned | 2 | 65% | Med | 20h | 2.5d | TICKET-029 |
| 📋 Planned | 3 | 40% | Med | 24h | 3d | TICKET-030 |
| 📋 Planned | 4 | 25% | Low | 10h | 1.25d | TICKET-031 |

---

## 🎯 Ticket Quick Reference

### TICKET-028: Auth + API Consolidation (Bước 1.2) ✨ START HERE
**Status:** 🔵 Ready (depends only on Bước 1.1 ✅)  
**Duration:** 3-4 hours  
**Effort:** 🟢 Low  
**Risk:** 🟢 Very Low  
**ROI:** ⭐⭐⭐⭐⭐ (100%)

**What:** Document & validate the auth/API extraction work from Bước 1.1.

**Why:** Formalize groundwork for future endpoint extraction. Low-hanging fruit to solidify foundation.

**Tasks:**
1. Create `packages/shared-types/README.md` with example implementations
2. Add JSDoc comments to `http-client.ts` & `auth-api.ts`
3. Validate E2E scenarios (Zalo login → auto-register, token refresh, error handling)
4. Run TypeScript strict mode checks
5. Verify no circular dependencies
6. Document security model for team knowledge

**Output:** Production-ready documentation + validation that Bước 1.1 is solid.

**Next:** TICKET-029 after this completes.

---

### TICKET-029: Shared UI Primitives & Hooks (Bước 2)
**Status:** 🟡 Planned  
**Duration:** 20-24 hours (2.5 days)  
**Effort:** 🟡 Medium  
**Risk:** 🟡 Medium  
**ROI:** ⭐⭐⭐⭐ (65%)

**What:** Extract reusable UI components & hooks (buttons, forms, error toasts, loading spinners) into `packages/shared-ui`.

**Why:** Eliminate design system duplication across frontend + Zalo. Single source of truth for UI consistency.

**Components Created:**
- `SocialLoginButton` (Google, Apple, Facebook, Zalo variants)
- `ErrorToast` (standardized error notifications)
- `LoadingSpinner` (consistent loading indicators)
- `AuthGuard` (auth protection wrapper)

**Hooks Created:**
- `useSocialLogin` (unified provider login abstraction)
- `useAuthToken` (token persistence interface)
- `useApi` (error handling + retry patterns)

**Users:** Frontend + Zalo mini app refactored to use shared components.

**Output:** `packages/shared-ui/` fully functional, both apps styling preserved, 40% UI duplication eliminated.

**Timeline:** Start after TICKET-028, parallel with TICKET-030 if team size allows.

---

### TICKET-030: Shared Endpoint Generalization (Bước 3)
**Status:** 🟡 Planned  
**Duration:** 24-32 hours (3 days)  
**Effort:** 🟡 Medium  
**Risk:** 🟡 Medium  
**ROI:** ⭐⭐⭐ (40%)

**What:** Consolidate remaining API endpoint definitions (User, Vocabulary, Review, Path, Analytics, Gamification) using factory pattern.

**Why:** Continue pattern from Bước 1.1 to remaining APIs. Reduce endpoint definition duplication by 70%+.

**Endpoints Consolidated:**
- `createUserApi()` — getMe, updateProfile, changePassword
- `createVocabularyApi()` — list, create, search, delete
- `createReviewApi()` — getQueue, submitAnswer, getAnalytics
- `createPathApi()` — list, getById, getProgress
- `createAnalyticsApi()` — getOverview, getStats
- `createGamificationApi()` — getStatus, getLevels, getAchievements

**Type Alignment:** Backend DTO alignment to ensure zero runtime mismatches.

**Output:** Centralized endpoint definitions, frontend + Zalo refactored, type-safe contracts.

**Timeline:** Parallel with TICKET-029 week 2-3.

---

### TICKET-031: CI/CD Standardization (Bước 4)
**Status:** 🟡 Planned  
**Duration:** 10-12 hours (1.25 days)  
**Effort:** 🟢 Low  
**Risk:** 🟢 Very Low  
**ROI:** ⭐⭐ (25%) but enables future automation

**What:** Replace monolithic CI/CD with modular GitHub Actions workflows.

**Why:** Shared packages should test once, not 3x. Clear responsibility (what fails → which test?). ~5-10min total feedback vs ~20-30min current.

**Workflows Created:**
1. `shared-tests.yml` — Test shared-types, shared-ui (3-5 min)
2. `frontend-tests.yml` — Test frontend lint/build/type/test (4-6 min)
3. `zalo-tests.yml` — Test Zalo lint/build/type (2-3 min)
4. `backend-tests.yml` — Test backend lint/type/test/build (8-10 min)
5. `integration-tests.yml` — E2E E2E validation (manual trigger, 15-30 min)

**Infrastructure:** Branch protection rules, npm registry setup placeholder.

**Output:** Fast CI feedback, clearer test ownership, scalable for future.

**Timeline:** After TICKET-030, week 4.

---

## 📈 Implementation Timeline

```
Week 1 (Now)
├─ Start TICKET-028 (Bước 1.2)
│  └─ Doc + E2E validation (0.5 days)
│
Week 2-3
├─ TICKET-029 (Bước 2) — Shared UI
│  └─ 2.5 days
├─ TICKET-030 (Bước 3) — Shared Endpoints [PARALLEL]
│  └─ 3 days (overlap with 029)
│
Week 4
├─ TICKET-031 (Bước 4) — CI/CD
│  └─ 1.25 days
│
Week 4-5
└─ Integration testing + team feedback
   └─ ~5-10 days

**Total:** ~8-10 weeks to full completion
**Full Deduplication:** 80%+ code elimination
**Operational Benefit:** Faster deployment, clearer maintenance
```

---

## 🎯 Success Metrics

### Quantitative
- **Code Duplication:** Reduce from ~70% → ~15% (80%+ improvement)
- **Test Runtime:** Current ~20-30min → Target <10min (50% faster)
- **Component Reuse:** 2 apps → 3 apps (Zalo) using same UI/auth/API core
- **LOC Reduction:** ~2000 LOC duplicate → ~500 LOC (75% less code to maintain)

### Qualitative
- **Developer Experience:** New developer can understand architecture in <4 hours (currently ~8 hours)
- **Maintenance Overhead:** Bug in auth flow → 1 place to fix (currently 2-3 places)
- **Onboarding:** Shared patterns documented; copy-paste becomes template-based

---

## 🔗 Inter-Ticket Dependencies

```
TICKET-028 (Bước 1.2)
├─ Validates DONE (Bước 1.1)
├─ Documentation only, no breaking changes
│
TICKET-029 (Bước 2) ← Requires 028 complete
├─ Depends on: shared-types stability
├─ Parallel with: TICKET-030 (if team >1 person)
│
TICKET-030 (Bước 3) ← Parallel start with 029
├─ Depends on: shared-types (extended in 028)
├─ Type alignment with backend (backend refactor in this ticket)
│
TICKET-031 (Bước 4) ← Requires 030 complete
├─ Depends on: All 3 apps stable (029+030)
├─ Infrastructure; no code breaking changes
│
Integration Testing (Future)
└─ Requires: All 4 tickets complete + optionally 031
   (Can start earlier if environment stable)
```

---

## 💰 Cost-Benefit Analysis

### Effort Investment: ~69 hours
- Bước 1.2: 3h documentation + validation (low cost)
- Bước 2: 20h UI extraction (medium effort)
- Bước 3: 24h endpoint generalization (medium effort)
- Bước 4: 10h CI setup (low effort, high value)
- Buffer: ~12h (20% contingency)

### Return on Investment (1 Year Horizon)
- **Maintenance Reduction:** ~100h/year → ~60h/year (40% productivity gain)
  - Bug fix in shared component: 2h-3h → 0.5h (80% faster)
  - New feature across platforms: 2-3 days → 1.5 days (40% faster)
- **Onboarding:** 8h → 4h per new dev (50% faster)
- **CI/CD:** ~100h/year debugging slow pipelines → ~20h/year (80% reduction)
- **Total 1-Year ROI:** 69h invest → 200+h saved = **3x return**

### Quality Improvements
- Zero duplicate bugs (shared code)
- Type-safe API contracts (fewer runtime surprises)
- Consistent error handling (reduced support burden)
- Fast CI feedback (catch issues earlier)

---

## ⚠️ Key Risks & Mitigations

### Risk: Breaking Changes to App Functionality
**Likelihood:** 🟡 Medium | **Impact:** High  
**Mitigation:**
- Extensive e2e testing (Task 4 of 028)
- Backwards compatibility period (keep old patterns 1 release)
- Local testing workflow documented per ticket
- Sample PR test before production (Task 10 of 031)

### Risk: Zalo SDK Compatibility Lost
**Likelihood:** 🔴 Low | **Impact:** Medium  
**Mitigation:**
- SDK logic isolated in hooks (useSocialLogin)
- Mock Zalo SDK for unit tests
- E2E validation on real SDK (in integration testing phase)

### Risk: Type Mismatches Between Backend & Apps
**Likelihood:** 🔴 Low | **Impact:** Medium  
**Mitigation:**
- Detailed type alignment task (Task 6 of 030)
- TypeScript strict mode enforcement
- Runtime response validation in tests

### Risk: CI Pipeline Complexity / Maintenance Burden
**Likelihood:** 🟢 Very Low | **Impact:** Low  
**Mitigation:**
- Modular workflows (each testable independently)
- Comprehensive documentation (.github/workflows/README.md)
- Started simple; enhanced over time as needs grow

---

## 📌 Execution Recommendations

### For Management/PM
1. **Estimate 8-10 weeks** for full completion (not 2-3 weeks)
2. **Prioritize 028+029** (ROI 100% + 65%) over other features
3. **028** is **critical** for 029-031 to work; don't skip
4. **Can pause after 029** if time-constrained (still 80%+ duplication cut)

### For Developers
1. Start TICKET-028 immediately (3h, unblocks rest)
2. Read ANALYSIS-zalo-completion.md for context
3. Follow ticket task checklists exactly (they're detailed)
4. Test locally before pushing (reduces CI iterations)
5. Document your work as you go (ticket templates include docs tasks)

### For Tech Lead
1. **Approve 028 quickly** (foundation for everything)
2. **Designate ticket owners** (029, 030 can be parallel → need 2 devs or staggered)
3. **Review PR for each ticket** before merging (especially type changes)
4. **Monitor CI feedback** during implementation
5. **Gather team feedback** on architecture after 029 (before committed to 030+031)

---

## 📚 How to Use This Roadmap

### Starting Your Day
1. Read this summary (5 min)
2. Open the next ticket (e.g., TICKET-028)
3. Follow the task checklist step-by-step
4. Ask questions if anything is unclear

### During Implementation
- Refer to "Related Files" section in ticket for context
- Check "Acceptance Criteria" before marking task done
- Run build/test commands in ticket to verify
- Update ticket description if requirements change

### After Completion
- Review summary section to ensure all success criteria met
- Request code review from tech lead
- Merge PR only when all checks ✅ + approval received
- Move to next ticket

---

## 🚀 Quick Start Checklist

- [ ] Read ANALYSIS-zalo-completion.md (understanding)
- [ ] Read TICKET-028 thoroughly (next action)
- [ ] Check if `npm run lint` script exists in each app
- [ ] Check if `npm run tsc` script exists (for strict mode validation)
- [ ] Confirm team communication about timeline
- [ ] Start TICKET-028 today (don't wait)

---

## 📞 Questions & Support

If unclear on:
- **Architecture decisions** → Check ANALYSIS-zalo-completion.md section "🎯 Chiến Lược Triển Khai"
- **Specific task steps** → Check ticket's task checkboxes (detailed + actionable)
- **Why this matters** → Check this document's "Success Metrics" + "Cost-Benefit Analysis"
- **Dependencies** → Check "Inter-Ticket Dependencies" graph above
- **Timeline concerns** → Check "Implementation Timeline" — can adjust if needs change

---

## 📊 Status Board

```
┌─────────────────────────────────────────────────────────────┐
│                    ZALO MINI APP COMPLETION                │
├─────────────────┬──────────┬──────────┬──────────┬──────────┤
│    Ticket       │  Status  │  ROI     │  Risk    │  ETA     │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Bước 1.1        │   ✅ DONE │ 100% ★★★★★ │ 🟢 VLow │ Done    │
│ TICKET-028 (1.2)│  🔵 READY │ 100% ★★★★★ │ 🟢 VLow │ 3/24    │
│ TICKET-029 (2)  │  🟡 PLAN │ 65% ★★★★  │ 🟡 Med  │ 3/31    │
│ TICKET-030 (3)  │  🟡 PLAN │ 40% ★★★   │ 🟡 Med  │ 4/7     │
│ TICKET-031 (4)  │  🟡 PLAN │ 25% ★★    │ 🟢 Low  │ 4/15    │
│ TOTAL           │          │          │         │ 5/15(?) │
└─────────────────┴──────────┴──────────┴──────────┴──────────┘

🔵 = Ready to start now
🟡 = Planned (waiting on blockers)
✅ = Complete
```

---

**Last Updated:** March 21, 2026  
**Next Review:** After TICKET-028 completion  
**Owner:** Engineering Team  
**Stakeholders:** Product, QA, DevOps
