## Context

See proposal.md - Why. Current state: platform tenant status transitions are limited to ACTIVE/SUSPENDED in `platform-tenants.service.ts`; there is no delete; the `/platform` list page has no row actions. Tenant access is blocked via the tenant-resolver middleware for SUSPENDED tenants.

## Goals / Non-Goals

**Goals:**
- Soft-delete tenants from the platform (record + DB preserved, access blocked).
- Extend settable statuses to include `EXPIRED`.
- Expose both actions per row in the tenants list with confirmation on delete.

**Non-Goals:**
- Hard deletion / dropping tenant databases.
- Restoring a deleted tenant (no un-delete UI/API in this change).
- Auto-expiry based on plan end dates — `EXPIRED` is set manually by the admin.

## Decisions

- **Soft-delete via new `DELETED` enum value** over a separate `deletedAt` column: one consistent status field drives the existing access gate and list filters; keeps TenantStatus as the single tenant-state source of truth. Alternative: separate `deletedAt` timestamp — rejected because the tenant gate would need two checks and deleted state would not appear in status filters.
- **Enum extension + migration**: add `EXPIRED` and `DELETED` to `TenantStatus` in `prisma/platform/schema.prisma` with a Prisma migration. Old values are untouched; migration is additive (safe to roll back by not writing DELETED/EXPIRED rows).
- **DELETED excluded from default list**: service-level filter injects `status: { not: 'DELETED' }` unless an explicit status filter is passed, so API consumers get the same semantics as the UI.
- **Delete endpoint `DELETE /platform/tenants/:id`** separate from the status PATCH: distinct operation, explicit in OpenAPI, and prevents callers from bypassing the no-DELETED-via-status rule without a separate guard.
- **Tenant access gate**: treat `EXPIRED` and `DELETED` the same as `SUSPENDED` in the tenant resolver (403).
- **UI**: per-row status `<select>` (ACTIVE/SUSPENDED/EXPIRED) plus a Delete button that uses `window.confirm` before calling the API; list refreshes after either action.

## Risks / Trade-offs

- [Risk] DELETED tenants still hold a database and tenant admins may try to log in → Mitigation: gate blocks them with 403; docs note restore is manual.
- [Risk] Existing code that exhaustively switches on TenantStatus may miss EXPIRED/DELETED → Mitigation: grep for TENANT_STATUSES/status checks and add the two values.
- [Trade-off] Soft-delete keeps data around forever → acceptable; hard delete can be a later change.
