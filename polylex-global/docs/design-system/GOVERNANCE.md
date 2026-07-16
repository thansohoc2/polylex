# PolyLex Web Design-System Governance

## Decision

PolyLex Web uses **Playful Light** as its only product theme for this delivery. Dark mode is deferred; new Web screens must not introduce a page-level theme fallback. The token architecture must remain extensible so a separately approved dark theme can be added later.

`@polylex/shared-ui` is the **Web-first** source for design tokens, motion, accessibility helpers, and reusable Web primitives. `apps/frontend` consumes those exports and owns feature-specific composition. This boundary is additive: existing package exports remain supported.

## Scope boundary

This policy applies to the browser application in `apps/frontend` and Web-facing code in `packages/shared-ui` only. It creates no implementation work or acceptance criteria for Zalo Mini App, Capacitor, iOS, Android, or another native shell. Cross-platform reuse requires a separate ticket and platform-specific validation.

## Responsive verification matrix

Every changed Web journey must be verified at these minimum viewport widths:

| Target | Width |
| --- | ---: |
| Compact mobile | 320 px |
| Standard mobile | 375 px |
| Large mobile | 430 px |
| Tablet | 768 px |
| Desktop | 1024 px |

Responsive layouts are mobile-first. Tablet and desktop may expand their layout, but must preserve the same information architecture and browser navigation behavior.

## Ownership and review

- **Product** owns journey priority, navigation hierarchy, and content outcomes.
- **Design** owns Playful Light visual decisions, token semantics, and approved visual exceptions.
- **Web engineering** owns implementation, browser fallbacks, accessibility, and automated quality gates.
- A semantic token addition or breaking component change requires Design and Web engineering review.
- A navigation or user-flow change additionally requires Product review.

## Exceptions

Provider-owned brand marks/colors, media artwork/overlays, data visualizations, and legal strings may use non-token values only when the source requirement cannot be represented semantically.

An exception must be documented beside the implementation or in the design-system allow-list with its owner, reason, affected files, and review/expiry condition. Design and Web engineering approve visual exceptions; Product also approves exceptions that change user behavior. Convenience or incomplete migration is not an exception.
