# TICKET-051: Web API error-code and mutation idempotency contract

**Status:** Proposed
**Priority:** P0 follow-up for TICKET-050
**Platforms:** Web API contract; backend implementation is outside TICKET-050
**Related:** TICKET-050

## Goal

Give PolyLex Web a stable, machine-readable contract for rendering errors and safely retrying mutations without comparing human-readable messages or creating duplicate data.

## Scope

- Define stable `error.code` values, HTTP status mapping, retryability, and localized-message ownership.
- Return a request correlation ID in response headers and error payloads; logs must not expose tokens, passwords, or request bodies containing sensitive data.
- Define idempotency behavior for user-triggered Web mutations, prioritizing review submission, quick-note enrichment/save, vocabulary creation, onboarding/path creation, and profile updates.
- Document key format, retention window, replay response, conflict behavior, and behavior when an identical key is reused with a different payload.
- Define timeout/network-retry guidance for the frontend.

Out of scope: UI redesign, changing ACRE semantics, database migrations without a reviewed implementation plan, and analytics vendor selection.

## Proposed error envelope

Errors expose a stable error code, a correlation ID, whether retry is safe, and optional field-level codes. Human-readable fallback text is not an API identifier and must never be parsed for control flow.

## Acceptance criteria

- [ ] A versioned catalog lists every supported error code, HTTP status, retry classification, and owning domain.
- [ ] Every error response carries a request correlation ID shared with structured backend logs.
- [ ] Validation errors identify fields with stable codes without leaking sensitive input.
- [ ] In-scope mutations accept an idempotency key and document retention, replay, in-progress, and payload-conflict behavior.
- [ ] Repeating a request with the same idempotency key and payload cannot create a duplicate mutation.
- [ ] Reusing a key with a different payload returns a stable conflict error code.
- [ ] Contract and integration tests cover success replay, retryable failure, permanent failure, timeout retry, and concurrent duplicate requests.
- [ ] Frontend mapping guidance distinguishes inline validation, session expiry, retryable error, and non-retryable error.

## Dependency on TICKET-050

TICKET-050 may standardize how current errors are displayed, but must not invent backend guarantees. Migration of retry-sensitive Web flows depends on this contract or an explicitly documented temporary no-retry decision.
