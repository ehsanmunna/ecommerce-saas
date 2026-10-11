## 1. Database

- [x] 1.1 Add `PlatformAdmin` model to `prisma/platform/schema.prisma` (email unique, passwordHash, timestamps)
- [x] 1.2 Add `plan` column to `Tenant` with default `BASIC`
- [x] 1.3 Create and run platform migration
- [x] 1.4 Seed first platform admin from `PLATFORM_ADMIN_EMAIL`/`PLATFORM_ADMIN_PASSWORD` env vars in dev

## 2. Platform auth API

- [x] 2.1 Create `platform-auth` module: `POST /platform/auth/login` returning a JWT with `type: 'platform'`
- [x] 2.2 Implement `PlatformAuthGuard` validating `type === 'platform'`; reject staff/tenant tokens
- [x] 2.3 Unit tests for login and guard (valid, invalid credentials, wrong-token-type rejection)

## 3. Platform tenants API

- [x] 3.1 `GET /platform/tenants` with status/plan filter and pagination
- [x] 3.2 `GET /platform/tenants/:id` with verification/provisioning timestamps and error info
- [ ] 3.3 `POST /platform/tenants` creating a tenant with owner email/plan, issuing an invite token, sending an invite email; tenant starts in `PENDING_OWNER_SETUP` and does not provision until the owner accepts
- [ ] 3.9 Public `POST /tenants/accept-invite` endpoint: validate single-use invite token, set owner password, transition to `PROVISIONING`, run provisioning, clear invite hash
- [ ] 3.10 `POST /platform/tenants/:id/resend-invite` and `POST /platform/tenants/:id/revoke-invite`
- [ ] 3.11 Add `PENDING_OWNER_SETUP` to `TenantStatus` enum and `inviteTokenHash`/`inviteExpiresAt` to the tenant schema migration
- [x] 3.4 `PATCH /platform/tenants/:id/status` to suspend/activate/reactivate with database-exists check before ACTIVE
- [x] 3.5 `POST /platform/tenants/:id/resend-verification` and `POST /platform/tenants/:id/revoke-verification-token`
- [x] 3.6 `POST /platform/tenants/:id/retry-provisioning`
- [x] 3.7 `PATCH /platform/tenants/:id/plan`
- [x] 3.8 Remove/410 the unguarded tenant-controller repair endpoints

## 4. Tenant enforcement

- [x] 4.1 Block tenant API requests with 403 when tenant status is `SUSPENDED`
- [x] 4.2 Persist signup `plan` from `RegisterTenantDto` onto the tenant record (plus validation of allowed values)

## 5. Admin app `/platform` UI

- [x] 5.1 `/platform/login` page storing a `platform_token`
- [x] 5.2 `/platform` layout guard redirecting to login when no valid token
- [x] 5.3 Tenant list page with status filter, plan, created date
- [x] 5.4 Tenant detail page: status actions (suspend/activate/reactivate), resend verification, revoke token, retry provisioning, plan edit
- [ ] 5.5 Create-tenant form (company name, slug, owner email, plan — no owner password; invite email is sent instead)
- [ ] 5.6 Public `/accept-invite?token=...` page where the owner sets their own password
- [ ] 5.7 Reset 5.3/5.4 to show `PENDING_OWNER_SETUP` state and invite resend/revoke actions

## 6. Verification

- [x] 6.1 API unit tests for platform module pass
- [ ] 6.2 Manual smoke: create tenant via platform UI, suspend it, confirm tenant API 403, reactivate
- [ ] 6.3 Existing tenant signup e2e still passes with `plan` persisted
