## Why

The platform currently has no way to operate or support its tenants beyond directly running SQL or curl against unauthenticated endpoints. Platform operators need a first-class, authenticated admin area to provision tenants on request, activate/deactivate them, and troubleshoot provisioning/verification state.

## What Changes

- New `PlatformAdmin` model and login (separate from tenant users), issuing platform-scoped JWTs.
- New `/platform` section in the admin app (separate login, guarded layout) listing tenants with status filters and details.
- Platform admin can create a tenant directly: slug, company name, owner email, plan — the owner does NOT get a password from the admin; instead an invite email is sent and the tenant waits in `PENDING_OWNER_SETUP` until the owner sets their own password, which triggers provisioning.
- Platform admin can change tenant status: activate (`ACTIVE` after re-provision check), suspend (`SUSPENDED`), and reactivate; suspended tenants' API access is blocked.
- Platform admin can view verification/provisioning state per tenant, resend verification emails, revoke/expire verification tokens, and retry failed provisioning.
- Existing unauthenticated tenant endpoints (`retry-provisioning`, `resend-verification`, status) become guarded by platform-admin auth or removed in favor of the platform routes.
- Tenant `plan` field becomes a real platform column (settable at signup and by platform admin), so the signup dropdown is no longer decorative.

## Capabilities

### New Capabilities
- `platform-admin-auth`: platform admin accounts, login, platform-scoped JWT guard.
- `platform-admin-tenants`: platform admin UI + API for listing/creating tenants, activating/suspending/deactivating tenants, resending verification, rotating/revoking verification tokens, and retrying failed provisioning.

### Modified Capabilities
- (none — no existing spec files yet)

## Impact

- `prisma/platform/schema.prisma`: add `PlatformAdmin` model; add `plan` column to `Tenant`; `TenantStatus.SUSPENDED` now honored by tenant auth.
- `apps/api`: new `platform` module (admin login, tenant list/detail, create tenant, suspend/activate, resend verification, revoke token, retry provisioning) plus a platform-JWT guard; existing unguarded tenant-repair endpoints are moved under platform auth.
- `apps/admin`: new `/platform` route tree with its own login page and guarded layout.
- Security: platform-admin credentials live only on the platform DB; no tenant user can hold platform access. Breaking for any client that depended on the old unauthenticated repair endpoints.
