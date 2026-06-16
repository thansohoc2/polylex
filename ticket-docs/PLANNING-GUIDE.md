# 📋 Zalo Mini App Completion - Complete Planning Package

**Created:** March 21, 2026  
**Status:** 🎯 Analysis Complete, Ready for Implementation  
**Package Contents:** 6 detailed documents covering analysis, planning, and execution

---

## 📁 Navigation Guide

### 🎯 **START HERE** — Quick Overview (5 minutes)
**👉 File:** [ROADMAP-zalo-completion.md](ROADMAP-zalo-completion.md)

**What it contains:**
- Executive summary (current state → target state)
- Ticket overview with ROI/risk/timeline
- Quick reference for managing the project
- Implementation timeline
- Success metrics & cost-benefit analysis

**Who should read:** Everyone (managers, developers, tech leads)

**Next step:** Refer to specific tickets from here

---

### 🔬 **DETAILED ANALYSIS** — Complete Technical Breakdown (20+ minutes)
**👉 File:** [ANALYSIS-zalo-completion.md](../ANALYSIS-zalo-completion.md) *(one level up)*

**What it contains:**
- Architecture decisions made so far (Bước 1.1)
- Detailed breakdown of remaining work (Bước 1.2-4)
- Per-step analysis with tasks, dependencies, risks
- Code examples showing patterns
- Migration strategies for each phase

**Who should read:** Tech leads, architects, experienced devs understanding "why"

**Next step:** Read corresponding ticket for execution detail

---

## 🎫 **IMPLEMENTATION TICKETS** — Detailed Execution Guides

### 1️⃣ **TICKET-028: Auth + API Consolidation (Bước 1.2)** ⭐ START HERE
**👉 File:** [TICKET-028-auth-api-consolidation.md](TICKET-028-auth-api-consolidation.md)

**Status:** 🔵 Ready to Start (no blockers)  
**Duration:** 3-4 hours  
**Effort:** 🟢 Low  
**ROI:** ⭐⭐⭐⭐⭐ (100%)

**What:** Document & validate the auth/API extraction done in Bước 1.1. Create README, add JSDoc, run E2E scenarios, verify TypeScript.

**Why:** Solidifies foundation for future work. Low-hanging fruit with high confidence.

**Contains:**
- 7 detailed tasks with sub-checklists
- E2E test scenarios (5 Scenarios with steps)
- TypeScript validation checklist
- File references and definitions of done

**Time estimate:** Doable in 1 day

**Recommended for:** Anyone on the team (first step, unblocks everything)

---

### 2️⃣ **TICKET-029: Shared UI Primitives & Hooks (Bước 2)**
**👉 File:** [TICKET-029-shared-ui-extraction.md](TICKET-029-shared-ui-extraction.md)

**Status:** 🟡 Planned (requires TICKET-028)  
**Duration:** 20-24 hours (2.5 days)  
**Effort:** 🟡 Medium  
**ROI:** ⭐⭐⭐⭐ (65%)

**What:** Extract reusable UI components (buttons, forms, toasts, spinners) & hooks (useSocialLogin, useAuthToken, useApi) into `packages/shared-ui`. Refactor frontend + Zalo to use them.

**Why:** Eliminate 40% of remaining UI duplication. Single source of truth for design system.

**Contains:**
- 12 detailed tasks with code examples
- Full component specifications (props, types, CSS patterns)
- Hook implementations (social login abstraction, token persistence, API error handling)
- Unit test patterns
- Integration testing guide
- Backwards compatibility strategy

**Time estimate:** 2.5 days (can be parallel with TICKET-030)

**Recommended for:** Frontend specialists

---

### 3️⃣ **TICKET-030: Shared Endpoint Generalization (Bước 3)**
**👉 File:** [TICKET-030-shared-endpoints.md](TICKET-030-shared-endpoints.md)

**Status:** 🟡 Planned (can start parallel with TICKET-029)  
**Duration:** 24-32 hours (3 days)  
**Effort:** 🟡 Medium  
**ROI:** ⭐⭐⭐ (40%)

**What:** Consolidate User, Vocabulary, Review, Path, Analytics, Gamification API endpoints into factories. Align backend DTOs with shared types. Refactor both apps to use factories.

**Why:** Continue pattern from Bước 1.1. Reduce 70%+ of remaining endpoint duplication. Type-safe contracts.

**Contains:**
- 10 detailed tasks with code examples
- Full type definitions (6 type modules)
- 6 endpoint factory implementations
- Backend DTO alignment guide
- Migration path for apps
- Backwards compatibility notice

**Time estimate:** 3 days (parallel with 029 if team size allows)

**Recommended for:** Backend specialist + senior dev who understands API patterns

---

### 4️⃣ **TICKET-031: CI/CD Standardization (Bước 4)**
**👉 File:** [TICKET-031-ci-standardization.md](TICKET-031-ci-standardization.md)

**Status:** 🟡 Planned (requires TICKET-030 complete)  
**Duration:** 10-12 hours (1.25 days)  
**Effort:** 🟢 Low  
**Risk:** 🟢 Very Low  
**ROI:** ⭐⭐ (25%) but enables future automation

**What:** Replace single CI workflow with 5 modular GitHub Actions pipelines (shared, frontend, Zalo, backend, integration). ~5-10 min total feedback vs. 20-30 min current.

**Why:** Faster feedback loop. Clear test ownership. Scalable for future growth.

**Contains:**
- 12 detailed tasks with workflow YAML examples
- Complete workflow specifications (shared-tests, frontend-tests, zalo-tests, backend-tests, integration-tests)
- Branch protection configuration
- Documentation template
- Testing validation checklist
- Future enhancements (npm registry, Docker, automation)

**Time estimate:** 1.25 days

**Recommended for:** DevOps / CI/CD specialist

---

## 📊 **How to Use These Documents**

### For Project Managers
1. Read **ROADMAP-zalo-completion.md** for timeline + budget
2. Share **ROADMAP** with stakeholders for alignment
3. Use **Ticket Quick Reference** section to track progress
4. Check **Status Board** weekly for updates

### For Technical Leads
1. Read **ANALYSIS-zalo-completion.md** to understand "why" decisions
2. Read **ROADMAP** for overall strategy
3. Review tickets in detail (or scan the Checklist sections)
4. Use **Inter-Ticket Dependencies** to plan team workload
5. Assign tickets based on "Recommended for" sections

### For Developers
1. Start with **ROADMAP-zalo-completion.md** intro (get oriented)
2. Open your assigned **Ticket** document
3. Work through **Tasks** section step-by-step
4. Use **Related Files** to navigate codebase
5. Refer to **Acceptance Criteria** before marking task done
6. Check off **Checklist** items as you go

### For Code Reviewers
1. Refer to **Ticket's Acceptance Criteria** when reviewing PR
2. Use **Definition of Done** section to validate completeness
3. Check **Risks** section for what to watch out for
4. Request changes if PR doesn't match ticket deliverables

---

## 🔄 **Recommended Reading Order**

### ⏱️ 5 Minutes — Get Oriented
1. This file (you're reading it)
2. ROADMAP executive summary section

### ⏱️ 20 Minutes — Understand Strategy  
1. ROADMAP complete (all sections)
2. ANALYSIS "Big Picture" + "🎯 Chiến Lược Triển Khai" sections

### ⏱️ 1-2 Hours — Plan Implementation
1. TICKET-028 full read (3h work)
2. TICKET-029 full read (2.5d work)
3. TICKET-030 full read (3d work)
4. TICKET-031 full read (1.25d work)
5. ROADMAP "📌 Execution Recommendations" section

### ⏱️ Day 1 — Start Work
1. Open TICKET-028
2. Follow task 1 checklist exactly
3. Complete task 1, move to task 2
4. Reference ANALYSIS if you need "why" context on any decision

---

## 🎯 **Success Metrics to Track**

### Per Ticket (Weekly)
- ✅ Checklist items completed: X/Y
- 🐛 Blockers encountered: 0 or list them
- 📅 Timeline on track: Yes/No + delta days

### Across All Tickets (Monthly)
- **Code Duplication:** % reduction (goal: 70% → 15% = 80% improvement)
- **Test Runtime:** Duration in minutes (goal: <10 min total)
- **TypeScript Errors:** 0 across codebase
- **Test Pass Rate:** 100% on all platforms

### After Completion (Post-Mortem)
- Actual effort vs. estimate
- What went well + what was hard
- Recommendations for next phase of refactoring

---

## 🚀 **Quick Action Items**

### Today
- [ ] Read ROADMAP (5 min)
- [ ] Schedule team sync to discuss (30 min)
- [ ] Assign TICKET-028 to a developer

### This Week
- [ ] TICKET-028 in progress or done
- [ ] Gather feedback from dev who worked on 028
- [ ] Finalize team assignment for 029+030

### Next Week
- [ ] TICKET-028 PR merged
- [ ] TICKET-029 + 030 started (ideally parallel)
- [ ] E2E testing plan defined (for after 030)

### Week 4
- [ ] TICKET-029 + 030 merged
- [ ] TICKET-031 in progress
- [ ] Integration testing (manual validation)

### End of Month
- [ ] All 4 tickets complete
- [ ] Merged to main
- [ ] Team training on new architecture
- [ ] Documentation updated in repo

---

## 💡 **Key Insights from Planning**

### Why This Order Works
1. **TICKET-028 first:** Validates foundation. Unblocks everything. Highest confidence.
2. **TICKET-029 + 030 parallel:** UI and endpoints are independent layers. Can work in parallel.
3. **TICKET-031 last:** Infrastructure. Doesn't affect code; just makes pipeline faster.

### Why Not Do It Differently?
- **❌ Doing 030 before 029:** Types before UI makes sense architecturally, but UI has higher perceived value (demo-able). Recommend 029 first for morale.
- **❌ Doing 031 first:** CI changes don't fix the core problem (duplication). Cosmetic benefit. Do after features are stable.
- **❌ Merging all into one big ticket:** Would be 69 hours in one PR. Unmergeable, risky, unclear progress. Breaking into 4 is better.

### Why We Estimate 8-10 Weeks
- Tickets content: 69 hours estimate
- Team size likely 1-2 developers
- Possible parallel work (029 + 030, maybe)
- Buffer for unknowns + review cycles + holidays
- Realistic: ~10h/week productive development = 6-7 weeks + 2-3 weeks for integration testing + buffer

---

## ❓ **FAQ**

### Q: Can we do all 4 tickets in parallel?
**A:** No, they have dependencies:
- TICKET-028 must be first (no blockers, validates 1.1)
- TICKET-029 + 030 can be parallel (independent layers)
- TICKET-031 depends on 030 (needs stable code)
- Recommended: 028 (1 person) → 029+030 (2 people) → 031 (1 person)

### Q: Do we have to do all 4?
**A:** No, but recommend this order:
- **Must-do:** 028 + 030 (solids foundation + API consolidation)
- **Highly recommended:** 029 (UI consistency, team morale)
- **Nice-to-have:** 031 (CI speedup, not critical)

### Q: What if we run out of time?
**A:** Prioritize:
1. TICKET-028 (3-4h, foundational)
2. TICKET-030 (3d, biggest duplication)
3. TICKET-029 (2.5d, UI polish)
4. TICKET-031 (1.25d, infrastructure)

Even 028+030 = huge improvement.

### Q: Can one developer do all 4?
**A:** Yes, but:
- 028: 0.5 days (easy)
- 029: 2.5 days (medium)
- 030: 3 days (medium)
- 031: 1.25 days (easy)
- **Total: ~8.75 days = ~2 weeks** (realistic)
- Better with 2 people parallel 029+030

### Q: What if something breaks during a ticket?
**A:** Refer to ticket's "⚠️ Risks" section:
- Identify which risk materialized
- Check mitigation strategy
- Escalate to tech lead + adjust timeline

### Q: How do we know we're done?
**A:** Check ticket's "✅ Acceptance Criteria" section.
- All criteria must be met
- All checklist items clicked
- Code review approved
- All tests passing

---

## 🔗 **Important Links for Reference**

These exist in workspace:

**Analysis & Planning:**
- `/Users/khoidang/code/sotaytuvung/ANALYSIS-zalo-completion.md` — Full technical analysis
- `/Users/khoidang/code/sotaytuvung/ticket-docs/ROADMAP-zalo-completion.md` — Executive roadmap

**Ticket Documents:**
- `/Users/khoidang/code/sotaytuvung/ticket-docs/TICKET-028-auth-api-consolidation.md`
- `/Users/khoidang/code/sotaytuvung/ticket-docs/TICKET-029-shared-ui-extraction.md`
- `/Users/khoidang/code/sotaytuvung/ticket-docs/TICKET-030-shared-endpoints.md`
- `/Users/khoidang/code/sotaytuvung/ticket-docs/TICKET-031-ci-standardization.md`

**This File:**
- `/Users/khoidang/code/sotaytuvung/ticket-docs/PLANNING-GUIDE.md`

---

## 📞 **Support & Questions**

### If you're stuck on...
- **Why a decision was made** → Check ANALYSIS.md
- **What the next step is** → Check current ticket's Tasks section
- **How much time something should take** → Check ticket's Effort + Timeline
- **What could go wrong** → Check ticket's Risks section

### Before asking for help
1. Read the relevant ticket section
2. Check if it's in the FAQ
3. Search ticket for keyword
4. Then escalate to tech lead

---

## 🎓 **Learning Resources**

### To understand the patterns being introduced:
- **Auth factory pattern:** See TICKET-028 examples + ANALYSIS section on "Auth Consolidation"
- **Endpoint factory pattern:** See TICKET-030 examples + 6 code samples
- **Shared package architecture:** See ANALYSIS "Shared Types Package" section
- **CI/CD modular workflows:** See TICKET-031 workflow YAML examples

### To understand NestJS/React patterns:
- Frontend/Zalo apps already use: Zustand, Axios, TypeScript
- Backend uses: NestJS, Prisma, TypeScript
- All share: Shared types, factories, protocol buffers (future)

---

## ✅ **Final Checklist Before Starting**

- [ ] Entire team has read ROADMAP
- [ ] Tech lead has read ANALYSIS + all tickets
- [ ] Developers assigned to TICKET-028
- [ ] Developers have access to this planning package
- [ ] Questions answered + team aligned
- [ ] TICKET-028 opened + started today

---

**Planning Complete!**  
**Next Action:** Start TICKET-028 immediately.  
**Questions?** Check FAQ or escalate to tech lead.

---

*This planning package represents ~40 hours of analysis & documentation.* 
*Implementing per these tickets should take ~69 hours of development.*  
*Total investment: ~110 hours for 3x productivity gain.*

---

**Last Updated:** March 21, 2026  
**Status:** 📋 Ready for Execution  
**Owner:** Engineering Team  
**Review Date:** After TICKET-028 completion
