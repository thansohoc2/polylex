# TICKET-052: Web product analytics baseline

**Status:** Proposed
**Priority:** P0 entry criterion for TICKET-050 Phase D
**Platforms:** PolyLex Web only
**Related:** TICKET-050

## Goal

Record a trustworthy pre-migration baseline for activation, onboarding completion, review engagement/completion, and recoverable errors so the Playful Light journey migration can be evaluated without silently adding an analytics vendor.

## Metrics

- **Activation rate:** eligible Web visitors who complete the agreed activation action within the attribution window.
- **Onboarding completion:** users who start onboarding and complete language, goal, CEFR, and first-path creation.
- **Review start rate:** eligible users who start a review session.
- **Review completion rate:** started sessions that reach the existing completion state; abandonment is reported separately.
- **Error rate:** failed user-facing operations per attempt, grouped by stable operation/error classification.
- **Retry rate and retry success:** retry actions per retryable failure and retries that subsequently succeed.

Product must define eligibility, activation action, guest/demo treatment, and denominator rules before collection begins.

## Event contract

At minimum, define versioned events for activation, onboarding started/completed, review started/completed/abandoned, operation failed, retry requested, and retry succeeded. Each definition specifies owner, trigger, allowed properties, deduplication key, and privacy classification. Never collect vocabulary content, credentials, access tokens, free-form notes, or other sensitive learning text.

## Ownership

- **Product:** metric definitions, success thresholds, and interpretation.
- **Web engineering:** deterministic event emission and tests.
- **Data/analytics owner:** validation, deduplication, dashboard/query, and retention/privacy review.

No analytics provider is selected by this ticket; existing approved infrastructure is used or a separate vendor decision is required.

## Baseline window and comparison

Use at least 14 consecutive representative days before the first Phase D journey migration. Record release versions, traffic exclusions, locale/device segments, sample size, and known incidents. Product/Data may extend the window when volume is insufficient. Compare the same definitions and segments after migration; event schema changes restart or explicitly bridge the baseline.

## Acceptance criteria

- [ ] Metric formulas, denominators, guest/demo treatment, attribution windows, and owners are approved.
- [ ] Versioned activation, onboarding, review, error, and retry events have a reviewed property/privacy contract.
- [ ] Event tests prevent duplicate completion and retry emissions.
- [ ] A pre-migration baseline covers the approved window and records sample size and known data-quality gaps.
- [ ] Product signs off target/guardrail thresholds before rollout.
- [ ] TICKET-050 Phase D starts only after the baseline is recorded, or Product documents an explicit exception with owner and risk.
