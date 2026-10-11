## Why

The local Postgres server has accumulated many tenant databases from testing. Only `tenant_diu` should remain so the dev environment isn't cluttered and old tenants don't resolve against stale schemas.

## What Changes

- Add a one-off script `scripts/drop-other-tenant-dbs.ts` that: lists all databases matching the `tenant_*` pattern on the configured server, drops every one except `tenant_diu`, and deletes the corresponding rows from the platform `Tenant` table (leaving the tenant_diu row).
- Run the script once.
- No application behavior changes — ops/maintenance only.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- None (pure ops script; `skip_specs: true`).

## Impact

- Local dev Postgres: all `tenant_*` DBs except `tenant_diu` dropped.
- Platform DB: `Tenant` rows for dropped databases removed.
- No API/admin/storefront code changes.
