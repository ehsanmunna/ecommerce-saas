## Context

See proposal.md for motivation. The password-reset-email feature is already implemented across all three auth realms. This change adds e2e test coverage only.

## Goals / Non-Goals

**Goals:**
- Verify the full password reset flow works end-to-end for staff, customer, and platform admin realms
- Cover token expiry, token reuse, and rate limiting edge cases

**Non-Goals:**
- No production code changes
- No new test infrastructure — use existing Jest + Supertest setup

## Decisions

### 1. Test structure

One e2e test file per realm (`password-reset.e2e-spec.ts`) with describe blocks for each scenario. Uses the existing test setup pattern from `platform-auth.spec.ts`.

- **Why:** Keeps all password reset tests in one place, easy to run with `npm run test:e2e`.

### 2. Test data isolation

Each test creates its own tenant/user and cleans up after itself. No shared state between tests.

- **Why:** Prevents test interdependency and flaky failures.

## Risks / Trade-offs

- [Tests may be slow due to email sending] → MailService logs instead of sending when SMTP is not configured, so tests run fast
- [Token timing-sensitive tests may flake] → Use short TTLs in test env or mock Date.now()
