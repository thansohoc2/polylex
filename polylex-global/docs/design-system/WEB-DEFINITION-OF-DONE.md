# Web Definition of Done

Apply this checklist to every PolyLex Web UI pull request. Mark non-applicable items with a short explanation.

## Design system

- [ ] Playful Light semantic tokens are used; no unexplained color, shadow, radius, spacing, or motion literals were added.
- [ ] Existing shared primitives are reused; any additive primitive API is documented and covered by tests/stories.
- [ ] Loading, empty, error/retry, success, disabled, and pending states are explicit where relevant.
- [ ] Any design-system exception is approved and recorded through the documented exception flow.

## Content and localization

- [ ] All user-visible and accessible text uses locale keys.
- [ ] English, Vietnamese, and Portuguese keys and interpolation placeholders pass `npm run validate:design`.
- [ ] Path, Review, Mastery, Streak, and XP terminology remains consistent.

## Responsive and accessibility

- [ ] Layout is reviewed at 320, 375, 430, 768, and 1024 px and at 200% zoom.
- [ ] Keyboard-only use works with logical order, visible focus, no traps, and correct focus restoration.
- [ ] Interactive targets are at least 44×44 px and have translated accessible names.
- [ ] Labels, errors, descriptions, landmarks, current navigation, and live regions are programmatically associated.
- [ ] Text/non-text contrast and automated axe checks meet WCAG 2.2 AA.
- [ ] Reduced-motion mode removes non-essential movement while preserving meaning.

## Browser and quality gates

- [ ] Current supported Chrome, Firefox, Safari, and iOS Safari behavior has been considered; progressive fallbacks are present where required.
- [ ] Unit, shared UI, type-check, build, Storybook, E2E, accessibility, and relevant visual regression checks pass.
- [ ] Screenshot diffs at approved viewports were reviewed and intentional changes approved.
- [ ] Bundle/PWA warnings and offline/cache behavior were assessed when relevant.

## Product and rollout

- [ ] Existing route, browser-back, review callback, persistence, API, and ACRE behavior is preserved unless explicitly scoped.
- [ ] Analytics impact is covered by TICKET-052, instrumented, or documented as a rollout waiver.
- [ ] No Zalo Mini App, native, or Capacitor files were changed by a Web-only ticket.
