## 1. Platform data model

- [x] 1.1 Add `PENDING_VERIFICATION` to `TenantStatus` plus `emailVerifiedAt`, `verificationTokenHash (@unique)`, `verificationExpiresAt`, `lastVerificationSentAt` columns in `prisma/platform/schema.prisma`
- [x] 1.2 Create and apply platform migration; regenerate platform Prisma client and verify `getStatus` returns new status

## 2. Mail infrastructure

- [x] 2.1 Add `nodemailer` + `@types/nodemailer` to `apps/api` and create `MailModule`/`MailService.sendTenantVerification()` with SMTP env (`SMTP_HOST/PORT/USER/PASS/FROM`, `ADMIN_APP_URL`)
- [x] 2.2 Add `.env.example` entries and document Mailtrap/Mailhog dev setup; verify a test send

## 3. Verify-first registration API

- [x] 3.1 Rewrite `TenantRegistrationService.register()` to create `PENDING_VERIFICATION` row with hashed token + expiry and send verification email (no provisioning)
- [x] 3.2 Add `GET /tenants/check-slug` with normalization and `available`/`reason` response
- [x] 3.3 Add `POST /tenants/verify-email` to validate single-use unexpired token, set `PROVISIONING`, run existing `TenantProvisioningService.provision()`, return final status
- [x] 3.4 Add `POST /tenants/:id/resend-verification` with 60s throttle, token rotation, and re-send
- [x] 3.5 Update Swagger docs and `RegisterTenant`/verify DTOs with validation errors (400/409/429)

## 4. Admin public signup web

- [x] 4.1 Extend `apps/admin/app/lib/api-client.ts` with `registerTenant`, `checkSlug`, `verifyEmail`, `resendVerification`, `getTenantStatus` helpers
- [x] 4.2 Build public `app/signup/page.tsx` with company/slug/email/password/plan fields, slugify, debounced live availability, and inline errors
- [x] 4.3 Build `app/signup/check-email/page.tsx` interstitial with destination email, 24h expiry note, and resend + cooldown
- [x] 4.4 Build `app/verify-email/page.tsx` handling `?token=`, progress/polling of `GET :id/status`, success → login link, failure/retry states
- [x] 4.5 Update root redirect in `app/page.tsx` so `/signup` and `/verify-email` stay public

## 5. Verification and docs

- [x] 5.1 Extend `tenant-lifecycle.e2e-spec.ts`: signup → pending (no DB) → verify → active → login; expired/invalid token; resend throttle; login blocked while pending
- [x] 5.2 Update `README`/`user-flow.md` signup examples from sync-`ACTIVE` curl to verify-first flow with SMTP setup
- [x] 5.3 Run `openspec validate --change add-public-signup-email-verification --strict` and fix findings
