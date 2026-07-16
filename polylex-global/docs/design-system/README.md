# PolyLex Web Design System

PolyLex Web uses one Playful Light theme. Governance, browser support, and accessibility requirements live beside this guide.

## Tokens

Import `@polylex/shared-ui/styles.css` once at the Web entry point. Use semantic CSS tokens from `packages/shared-ui/src/styles/tokens.css` rather than visual literals:

- Surfaces/content: `--color-canvas`, `--color-card`, `--color-line`, `--color-ink-*`
- Actions/brand: `--color-coral`, `--color-grape`, `--color-on-brand`
- Feedback: `--color-ok`, `--color-warn`, `--color-bad`, `--color-info` and their `-soft` counterparts
- Shape/motion: `--radius-*`, `--duration-*`, `--ease-*`

A new token must describe reusable meaning, work on Playful Light, meet contrast requirements, and be added to Storybook when it changes a primitive. Run `npm run validate:design` after every token or locale change.

## Components

Import reusable controls from `@polylex/shared-ui`:

- `TextField`, `Select`, `Checkbox`, and `Switch` for labelled form controls.
- `Dialog` for modal interactions with focus restoration.
- `AsyncState` for mutually exclusive loading, empty, error, and success states.
- `ErrorToast`/`Toast` for non-blocking feedback.

Keep feature-specific composition in the frontend. Extend shared primitives additively and preserve native HTML props and semantics.

## State patterns

Every data-driven section must explicitly handle loading, empty, error/retry, and success. Mutation controls stay disabled while pending, prevent duplicate submissions, preserve entered data on failure, and expose translated feedback.

## Responsive design

Start at 320 px and review 320, 375, 430, 768, and 1024 px widths. Page content expands beyond mobile on tablet/desktop; do not lock the application shell to a phone-sized column. Maintain 44×44 px targets and avoid horizontal scrolling at 200% zoom.

## Verification and Storybook

- Run Storybook: `npm run storybook --workspace=packages/shared-ui`
- Build Storybook: `npm run build-storybook --workspace=packages/shared-ui`
- Run Web gates: `npm run test:web`
- Run full CI-equivalent gates: `npm run test:web:ci`

Stories cover default, error, disabled, long-content, loading, empty, retry, dialog, and toast states. Visual changes require screenshots at the approved responsive widths.

## Exception flow

Do not introduce a second theme, an untracked visual literal, or a duplicate primitive. If a product requirement cannot use the current system:

1. Document the user need and affected journeys.
2. Explain why existing tokens/primitives are insufficient.
3. Propose the smallest reusable addition and accessibility/browser fallback.
4. Obtain design-system owner approval in the pull request.
5. Record the approved exception in `GOVERNANCE.md` and add automated coverage.
