## Why

New tenants can only be created today via a dev-only `curl POST /tenants/register` that synchronously provisions a Postgres database with no email check. This blocks public launch: fake emails waste databases, slugs can be squatted, and store owners have no self-serve UI. A public signup page in the admin app with verify-before-provision closes that gap.

## What Changes

- Change `POST /tenants/register` to verify-first: creates a `PENDING_VERIFICATION` platform row (no database provisioned yet), stores a hashed verification token with 24h expiry, and sends an SMTP verification email.
- Add `GET /tenants/check-slug?slug=` for live slug availability in the signup form.
- Add `POST /tenants/verify-email { token }` which validates the token, flips the tenant to `PROVISIONING`, and runs the existing `TenantProvisioningService.provision()` synchronously, returning `ACTIVE` or `PROVISIONING_FAILED`.
- Add `POST /tenants/:id/resend-verification` with a 60s throttle to rotate and re-send the token.
- Add a real SMTP `MailModule` (nodemailer) with `SMTP_*` env config and a swappable `MailService` interface.
- Add public admin routes: `/signup` (company, slug, email, password, plan), `/signup/check-email` interstitial with resend, and `/verify-email?token=` which verifies, polls `GET /tenants/:id/status`, and links to `/login?slug=`.
- **BREAKING**: `POST /tenants/register` no longer returns `ACTIVE` immediately and no longer provisions synchronously; clients must verify email first then poll status.

## Capabilities

### New Capabilities
- `tenant-signup-verification`: verify-first tenant intake — PENDING_VERIFICATION lifecycle, token issuance/validation/expiry, SMTP verification email, check-slug, verify-email, resend-verification, and gating of login/provisioning on verification.
- `admin-signup-web`: public signup web flow in the admin Next.js app — signup form with live slug check, check-email interstitial, verify-email handling with status polling, and redirect to login.

### Modified Capabilities
- None (existing `phase-1-saas-foundation` tenant-registration behavior is superseded by the new verify-first capability rather than delta-edited; main `openspec/specs/` is empty).

## Impact

- Affected code: `apps/api/src/modules/tenant/tenant.controller.ts`, `tenant-registration.service.ts`, `prisma/platform/schema.prisma` (new `PENDING_VERIFICATION` status + verification columns + migration), new `apps/api/src/modules/mail/`, `apps/admin/app/signup/**`, `apps/admin/app/verify-email/**`, `apps/admin/app/lib/api-client.ts`.
- APIs: `POST /tenants/register` response contract changes; 3 new endpoints (`check-slug`, `verify-email`, `resend-verification`); Swagger updates.
- Dependencies: new `nodemailer` (+ `@types/nodemailer`) in `apps/api`; new SMTP env vars (`SMTP_HOST/PORT/USER/PASS/FROM`, `ADMIN_APP_URL`); e2e suite `tenant-lifecycle.e2e-spec.ts` must cover verify-first path.
- Systems: provisioning cost shifts from register-time to verify-time; unverified rows need future cleanup (out of scope, recorded as follow-up).
