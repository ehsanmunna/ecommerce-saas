## Context

See proposal.md. Tenant auth currently issues JWTs with `type: 'staff'` from tenant DBs. Platform admin needs a parallel, isolated auth path. Platform DB already holds tenant lifecycle state (status, verification token hash, owner credentials until provisioning). The admin app is a Next.js App Router app with route-level `layout.tsx` guards per section.

## Goals / Non-Goals

**Goals:**
- Platform admin accounts live in the platform DB and authenticate via a dedicated login endpoint.
- All platform-management endpoints sit under a `platform` NestJS module guarded by a platform JWT strategy; tenant JWTs are rejected.
- The admin app gets a `/platform` route tree with its own login and guarded layout, listing/filtering tenants and exposing repair actions.
- `Tenant.plan` becomes a real persisted column (signup dropdown now persists).
- `SUSPENDED` status is enforced on tenant API requests.

**Non-Goals:**
- No billing/Stripe integration, no plan-based feature gating beyond storage.
- No multi-role platform RBAC (single admin role).
- No tenant-admin self-service reactivation — only platform admin.

## Decisions

- **Separate `PlatformAdmin` table vs env-based single admin**: chose table — inviteable, auditable, rotatable; env single-account doesn't scale and is easy to lock yourself out of. Alternative: reuse tenant `User` with a `platform` flag — rejected because platform auth would need a tenant DB connection.
- **Platform JWT carries `type: 'platform'` claim**, validated by a `PlatformAuthGuard`; reuses existing `JWT_ACCESS_SECRET` and `@nestjs/jwt`. Alternative: separate secret — deferred; note rotation concern.
- **Platform admin creates tenants by calling into existing `TenantRegistrationService` internals** (in invite mode: create record, issue hashed invite token, send invite email, defer provisioning) rather than duplicating provisioning logic.
- **Invite-based owner onboarding**: `POST /platform/tenants` takes company name, slug, owner email, plan — no password. Tenant gets a new `PENDING_OWNER_SETUP` status and a hashed invite token (single-use, expiring). Public `POST /tenants/accept-invite` lets the owner set their password; on success the token is consumed and provisioning runs synchronously. Alternative considered: admin sets a temporary password and rotates it — rejected; owners set their own credentials from the start, and a shared password is a leak vector.
- **Suspend = status flip only**; tenant API guard (tenant connection/status check) responds 403 for suspended tenants. No DB drop on suspend (data is needed to reactivate).
- **`/platform` in the same Next.js app with its own layout guard**, not a separate app — one repo, one dev server, distinct route tree and storage keys (`platform_token` vs tenant token).
- **Move repair endpoints under `/platform/*` and remove the unguarded tenant-controller repair routes** — they were effectively open admin.

## Risks / Trade-offs

- Platform JWT secret shares tenant JWT secret → [Risk] token from staff user has `type: 'staff'` so guard rejects cross-use; enforce strict `type` check server-side.
- Tenant created by admin never has a verified owner password until invite is accepted → [Risk] owner never clicks the invite; mitigation: platform admin can revoke/resend invite, tenant sits in `PENDING_OWNER_SETUP` indefinitely, nothing provisions.
- Suspended tenant guard adds a DB read per request → acceptable for correctness; can cache later.
- Removing unauthenticated repair endpoints is breaking → call it out in changelog/migration note in tasks.
- First admin bootstrap needs a seed script → include in tasks; document in README/env example.

## Migration Plan

1. Prisma migration: add `PlatformAdmin`, `Tenant.plan` (default `BASIC`), `TenantStatus.PENDING_OWNER_SETUP`, and `Tenant.inviteTokenHash`/`inviteExpiresAt` columns.
2. Seed first platform admin from env vars (`PLATFORM_ADMIN_EMAIL/PASSWORD`) on API boot in non-prod.
3. Deploy API (new `/platform/*` routes; old repair endpoints return 410/404).
4. Deploy admin app `/platform` section.
5. Rollback: drop `/platform` module from app module; tenant data unaffected (only additive columns).

## Open Questions

- Whether to keep `retry-provisioning` on the tenant controller for backward compat — leaning remove.
