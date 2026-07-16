# Web Accessibility Standard

PolyLex Web targets **WCAG 2.2 AA**. These rules apply to all new and changed Web journeys, shared UI primitives, reviews, and pull requests.

## Perceivable

- Normal text and interactive controls must meet a contrast ratio of at least 4.5:1; large text must meet 3:1.
- Meaning must not depend on color alone. Correct, warning, error, mastery, and ranking states require text, icons, or other non-color cues.
- Images that convey meaning require localized alternative text. Decorative images and icons use empty alternative text or `aria-hidden="true"`.
- Audio learning controls require translated accessible names and a visible text alternative where the exercise permits it.

## Operable

- Every interactive element must be reachable and usable by keyboard with a logical tab order.
- Controls must have a visible `:focus-visible` indicator; do not remove outlines without an equivalent replacement.
- Pointer targets must be at least **44×44 px**, including navigation, audio, answer, close, and icon-only controls.
- Native browser back behavior remains available. Do not introduce route blockers without a reviewed product requirement.
- A visible-on-focus skip link must target the stable `main-content` landmark.
- Dialogs and bottom sheets move focus inside on open, close on Escape where appropriate, trap focus when modal, and restore focus to the trigger on close.

## Understandable

- Inputs have persistent labels. Placeholder text is supplementary and never the only label.
- Validation errors are specific, translated, linked with `aria-describedby`, and reflected by `aria-invalid`.
- Navigation labels and terminology for Path, Review, Mastery, Streak, and XP remain consistent across locales.
- Mutating actions prevent accidental duplicate submission while pending and communicate failure without discarding entered data.

## Robust

- Prefer native semantic HTML before ARIA. Use one stable `<main>` landmark per page shell.
- Current navigation uses `aria-current="page"`; switches expose `role="switch"` and `aria-checked`; dialogs have accessible titles and descriptions.
- Loading announcements use `role="status"`; blocking errors use `role="alert"` or an equivalent live region without repeatedly interrupting assistive technology.
- Test current Chrome, Firefox, Safari, and iOS Safari targets with keyboard navigation and at least one screen reader before releasing a new critical journey.

## Motion and animation

- Respect `prefers-reduced-motion: reduce` globally and through Framer Motion's `useReducedMotion` for page-level transitions.
- In reduced-motion mode, remove non-essential translate, scale, parallax, stagger, and confetti effects. State changes must remain understandable without animation.
- Never use flashing content above accessibility thresholds.

## Review checklist

- [ ] Keyboard-only completion works without traps.
- [ ] Focus order follows the visual and reading order.
- [ ] Focus is restored after every modal interaction.
- [ ] Every control has a translated accessible name.
- [ ] Labels, descriptions, errors, and live regions are programmatically associated.
- [ ] Text and non-text contrast meet WCAG 2.2 AA.
- [ ] All pointer targets are at least 44×44 px.
- [ ] Zoom at 200% and narrow/mobile reflow do not hide actions or content.
- [ ] `prefers-reduced-motion` provides a usable reduced-motion experience.
- [ ] Automated axe checks pass with no serious or critical violations; keyboard and screen-reader checks are still performed manually.
