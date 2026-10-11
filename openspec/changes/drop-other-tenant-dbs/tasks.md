## 1. Cleanup script

- [x] 1.1 Add `scripts/drop-other-tenant-dbs.ts`: connect with tenant DB admin creds, list `tenant_%` databases in `pg_database`, drop all except `tenant_diu` (terminate backends first)
- [x] 1.2 In the same script, delete `Tenant` rows from the platform DB whose `database_name` was dropped (keep `tenant_diu`)
- [x] 1.3 Require a `--yes` confirmation flag before executing drops

## 2. Run

- [x] 2.1 Run the script with `--yes`; verify only `tenant_diu` remains and platform registry matches
