## Purpose

Creates and initializes the isolated resources a newly registered tenant
needs — its own database, schema, and default data — and ensures a partial
failure never leaves the platform in an inconsistent or unsafe state.

## ADDED Requirements

### Requirement: Provision an isolated tenant database
When a tenant enters `PROVISIONING`, the system SHALL create a dedicated
database for it, apply the current schema migrations, seed default roles,
default settings, and a default theme, and create the tenant's owner
account.

#### Scenario: Successful provisioning
- **WHEN** all provisioning steps (database creation, migration, seeding,
  owner account creation) complete without error
- **THEN** the tenant is marked `ACTIVE` and the owner can log in to that
  tenant

### Requirement: Provisioning failure leaves no unsafe partial state
If any provisioning step fails, the system SHALL NOT mark the tenant
`ACTIVE`, and SHALL NOT leave a partially-initialized tenant database
reachable by tenant traffic.

#### Scenario: Migration fails after database creation
- **WHEN** the tenant's database is created successfully but schema
  migration fails
- **THEN** the tenant is marked `PROVISIONING_FAILED`, the partially
  migrated database is dropped or clearly marked unusable, and no request
  is routed to it

### Requirement: Retrying failed provisioning is idempotent
The system SHALL allow provisioning to be retried for a tenant in
`PROVISIONING_FAILED` without creating duplicate tenant records or leaving
orphaned resources from the failed attempt.

#### Scenario: Retry after failure
- **WHEN** provisioning is retried for a tenant in `PROVISIONING_FAILED`
- **THEN** the system cleans up any partial resources from the previous
  attempt before re-running provisioning, and the tenant ends in either
  `ACTIVE` or `PROVISIONING_FAILED` — never a duplicate tenant record

### Requirement: Consistent schema across tenant databases
Every tenant database the system provisions SHALL be created at the same
schema/migration version as every other currently active tenant.

#### Scenario: Two tenants provisioned back-to-back
- **WHEN** two tenants are provisioned in sequence without any migration
  changes in between
- **THEN** both tenant databases end up at the identical schema/migration
  version
