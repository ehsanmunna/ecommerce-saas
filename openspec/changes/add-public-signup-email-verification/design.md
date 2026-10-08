## Context

See proposal.md Why. Current state: `TenantRegistrationService.register()` validates slug, bcrypt-hashes the owner password, creates a `PROVISIONING` row in the platform DB, then synchronously `await provisioning.provision(id)` (DB create → migrate → seed roles/settings/theme/owner → `ACTIVE`, wipe owner creds). No email infra exists. Admin has only `/login`; root `/` forces login. `TenantResolverMiddleware` only serves `ACTIVE` tenants, so `PENDING_VERIFICATION` is naturally gated.

## Goals / Non-Goals

**Goals:**
- Verify-first lifecycle with no infra created before email proof.
- Real SMTP delivery behind a swappable interface; live slug check; public admin signup pages.
- Reuse existing provisioning, status, and retry endpoints unchanged where possible.

**Non-Goals:**
- Async queue/worker for provisioning (verify call still awaits provision; acceptable 5–30s post-click).
- Captcha, billing/trial, custom domains, unverified-row cleanup cron (recorded as follow-up).
- Customer (storefront) email verification — staff/owner only.

## Decisions

1. **New `PENDING_VERIFICATION` enum value + verification columns on `Tenant`** (over separate table).
   - Rationale: one row per signup keeps `check-slug`, `getStatus`, and resolver logic single-table; token hash unique index gives constant-time lookup. Columns: `emailVerifiedAt DateTime?`, `verificationTokenHash String? @unique`, `verificationExpiresAt DateTime?`.
   - Alternative (separate `TenantEmailVerification` table) rejected: extra join + orphan handling for no benefit at single-owner v1.

2. **Token: `crypto.randomBytes(32)` hex, stored as `sha256`, 24h expiry; single-use.**
   - Rationale: matches existing refresh-token hashing pattern in `AuthService`; URL-safe; invalidation by nulling hash on consume + rotating on resend.
   - Verify URL: `${ADMIN_APP_URL}/verify-email?token=<raw>`; API takes `{ token }` and hashes server-side for comparison (timing-safe compare not required at this entropy, plain equality on hashes is fine).

3. **Register creates pending row + sends email, does NOT provision.**
   - Flow: validate → `create(status: PENDING_VERIFICATION)` → `mail.sendTenantVerification()` → return `201 { id, slug, status }`. Provisioning moves to `verify-email` handler: `update(status: PROVISIONING)` → `await provision(id)` → return final tenant. Provisioning failure path (drop DB, `PROVISIONING_FAILED`) reused as-is; existing `retry-provisioning` covers recovery.
   - Alternative (provision-then-gate-login) rejected per user decision: wastes a DB per fake email.

4. **New `MailModule` with nodemailer SMTP transport.**
   - `MailService.sendTenantVerification(to, verifyUrl, companyName)`; config via `SMTP_HOST/PORT/USER/PASS/FROM`, `ADMIN_APP_URL`, `VERIFICATION_TOKEN_TTL_HOURS`. Fail-open choice: if SMTP send fails, register returns `500` and leaves row `PENDING_VERIFICATION` so resend can recover (no silent signup). Dev uses Mailtrap/Mailhog; no console-token leak in prod (return token only when `NODE_ENV !== production` for e2e).

5. **Three new platform endpoints (no tenant middleware, same exemption as register):** `GET /tenants/check-slug?slug=`, `POST /tenants/verify-email`, `POST /tenants/:id/resend-verification` (60s throttle via `updatedAt`-adjacent `lastVerificationSentAt` or in-memory + DB timestamp; prefer DB column to survive restarts).
   - `check-slug` normalizes lowercase, returns `{ available, reason?: invalid|reserved|taken }` — never enumerates emails.

6. **Admin frontend: public `/signup`, `/signup/check-email`, `/verify-email`.**
   - Extend `lib/api-client.ts` with `registerTenant`, `checkSlug`, `verifyEmail`, `resendVerification`, `getTenantStatus`. Slug input slugifies + debounces 300ms. Root `app/page.tsx` allowlist keeps public routes unredirected. Verify page polls `GET :id/status` every 2s up to 60s after verify returns `PROVISIONING` (covers slow DB create).

## Risks / Trade-offs

- [SMTP down at signup] → 500 with pending row; user retries resend. Mitigation: clear error + resend path; monitor SMTP errors.
- [Slug squatting cheap without DB cost] → rate-limit register/check-slug (throttle e.g. 10/min/IP) + future captcha/cleanup.
- [Sync provision on verify blocks HTTP] → verify page shows progress + polling; move to job queue if p99 > 30s.
- [Unverified row accumulation] → follow-up nightly delete of `PENDING_VERIFICATION` older than 7 days + resend cap (e.g. 5/day).
- [Token leak in logs/URLs] → only hash persisted; raw token only in email + dev response; single-use + expiry bounds blast radius.

## Migration Plan

1. Deploy platform migration adding enum value + columns (additive, backward compatible; old code ignores new columns).
2. Deploy API (register verify-first + new endpoints + MailModule) with SMTP env set; old clients doing `register → immediate login` will now get `PENDING_VERIFICATION` → must update docs/e2e.
3. Deploy admin (new pages); update `user-flow.md`/`README` curl examples.
4. Rollback: revert API + admin; pending rows stay inert (no DBs created); already-`ACTIVE` tenants unaffected.

## Open Questions

- None blocking. Deferrable: exact SMTP provider credentials, rate-limit values tuning, cleanup-cron schedule.
