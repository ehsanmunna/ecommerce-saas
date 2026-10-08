## Why

Platform operators can already change a tenant's status via the API and view the tenant list in the admin app, but the tenants list UI exposes no actions. Operators must leave the list (or use curl) to suspend, reactivate, expire, or remove a tenant. Tenant removal is not possible at all — there is no DELETED state.

## What Changes

- Add `DELETED` and `EXPIRED` values to the platform `TenantStatus` enum (Prisma migration).
- Tenants list (`/platform`) gains per-row actions: set status to `ACTIVE` / `SUSPENDED` / `EXPIRED`, and delete (soft-delete → status `DELETED`), with a confirmation prompt.
- Delete is a soft-delete: the tenant record is kept, status becomes `DELETED`, the tenant DB is untouched, and tenant auth is blocked (DELETED behaves like SUSPENDED for the tenant-resolver gate).
- The tenants list hides `DELETED` tenants by default; they remain visible when filtered by status `DELETED`.
- `PATCH /platform/tenants/:id/status` now accepts `ACTIVE`, `SUSPENDED`, or `EXPIRED` (previously only ACTIVE/SUSPENDED). Setting `INACTIVE`/`DELETED` via the status endpoint is rejected; deletion goes through the delete endpoint.
- New `DELETE /platform/tenants/:id` endpoint that soft-deletes (sets `DELETED`).
- `platform_token`-authed tenant sessions for a DELETED tenant are rejected, same as SUSPENDED.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `platform-admin-tenants`: status changes allowed set grows (ACTIVE/SUSPENDED/EXPIRED), a delete (soft-delete → DELETED) action is added, and the list UI exposes both actions per row.

## Impact

- `prisma/platform/schema.prisma`: extend `TenantStatus` enum; new migration.
- `apps/api/src/modules/platform/platform-tenants.service.ts` / controller: accept EXPIRED, add delete, exclude DELETED from default list filtering.
- `apps/api/src/common/middleware/tenant-resolver.middleware.ts` (or equivalent gate): treat DELETED like SUSPENDED.
- `apps/admin/app/platform/page.tsx`: per-row status dropdown + delete button with confirm.
- `apps/admin/app/lib/platform-api-client.ts`: `deleteTenant`, `updateTenantStatus` client helpers.
- `user-flow.md`: platform-admin section updated with delete/status-from-list.
