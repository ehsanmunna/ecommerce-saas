## Context

See proposal.md - Why. Tenant DBs live on one server (from `apps/api/.env`: host localhost, port 55432, admin user `saas`), named `tenant_<slug>`, each registered in the platform `Tenant` table. The platform DB itself must never be dropped.

## Goals / Non-Goals

**Goals:**
- Drop all `tenant_*` databases except `tenant_diu`.
- Remove matching rows from platform `Tenant` so no dropped tenant still resolves.

**Non-Goals:**
- Touching production; this is a local dev cleanup.
- Deleting backups or the platform/maintenance databases.

## Decisions

- **Node script via the same `pg` connection pattern used by tenant provisioning**: keeps credentials/port consistent and gives transactional control; a `psql`-only alternative would require repeating connection setup.
- **Match databases by the `tenant_` prefix** rather than an explicit list: covers any unknown stray DBs; `tenant_diu` is the sole allow-list entry.
- **Delete `Tenant` rows after dropping DBs, keyed on `database_name`**: registry stays consistent with what exists on disk.

## Risks / Trade-offs

- [Risk] Irreversible data loss for dropped tenants → Mitigation: local dev only; script prints the list of databases it will drop and requires confirmation before executing.
- [Risk] Active connections block DROP DATABASE → Mitigation: use `WITH (FORCE)` (Postgres 13+) or terminate backends first.
