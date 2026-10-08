## 1. Schema and API

- [x] 1.1 Add `EXPIRED` and `DELETED` to the `TenantStatus` enum in `prisma/platform/schema.prisma` and create a Prisma migration
- [x] 1.2 Update `UpdateTenantStatusDto` / `platform-tenants.service.ts` to accept `EXPIRED` and reject `DELETED` via the status endpoint (400)
- [x] 1.3 Add `DELETE /platform/tenants/:id` that soft-deletes (sets `DELETED`); 404 unknown, 409 already-deleted
- [x] 1.4 Exclude `DELETED` tenants from the default tenant-list results; return them only when filtering by `DELETED`
- [x] 1.5 Treat `EXPIRED` and `DELETED` as 403 in the tenant-resolver middleware (same as `SUSPENDED`)
- [x] 1.6 Regenerate the platform Prisma client

## 2. Admin UI

- [x] 2.1 Add `updateTenantStatus` and `deleteTenant` helpers to `apps/admin/app/lib/platform-api-client.ts`
- [x] 2.2 Add per-row status `<select>` (ACTIVE/SUSPENDED/EXPIRED) to the `/platform` tenants list, refreshing on change
- [x] 2.3 Add a per-row Delete button with `window.confirm`, calling delete then refreshing the list

## 3. Docs and verification

- [x] 3.1 Update `user-flow.md` platform-admin section with delete + status-from-list
- [ ] 3.2 Manually verify: list excludes DELETED, filter by DELETED returns them, expired/deleted tenant blocked with 403, delete confirm cancel does nothing
