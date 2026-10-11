## Why

The project currently has only an architecture design document
(`ecommerce-saas-multi-tenant-system-design.md`) and no implementation. Every
later phase (ecommerce features, branding, custom domains, billing) depends
on a working foundation: tenants can sign up, each gets an isolated
database, requests get routed to the right tenant, users can authenticate,
and a tenant owner has somewhere to land after registering. Phase 1 builds
that foundation, matching the design doc's own "Phase 1 — SaaS Foundation"
scope (tenant registration, tenant database provisioning, tenant resolver,
authentication, basic dashboard).

## What Changes

- Add a Platform Database holding the tenant registry (id, name, slug,
  database connection info, status, timestamps) — scoped to what Phase 1
  needs; plans/billing/subscriptions fields are deferred to the Phase 5
  capability that will introduce them.
- Add a tenant registration flow: company submits registration info, a
  tenant record is created in the Platform DB, and provisioning is kicked
  off.
- Add a tenant provisioning flow: create the tenant's isolated PostgreSQL
  database, run schema migrations, seed default roles/settings/theme, create
  the owner account, and mark the tenant `ACTIVE` (or `PROVISIONING_FAILED`
  with a safe rollback if any step fails).
- Add a tenant resolver: every incoming request's `Host` header is resolved
  to a tenant, and the request is bound to that tenant's database connection.
  Custom-domain resolution is out of scope for Phase 1 (Phase 4); only the
  default `<slug>.yoursaas.com`-style subdomain pattern is required.
- Add authentication: JWT + refresh token, scoped to a resolved tenant. An
  authenticated request's token `tenantId` must match the tenant resolved
  from the domain; a mismatch is rejected.
- Add a minimal authenticated tenant dashboard shell: login, a tenant
  context banner, and navigation placeholders for the sections later phases
  will fill in (Products, Orders, Customers, Settings, etc.). No ecommerce
  data management, branding customization, or billing UI is implemented yet
  — those are later phases.

## Capabilities

### New Capabilities
- `tenant-registration`: intake of a new tenant/company signup; validates
  input, creates the Platform DB tenant record, and triggers provisioning.
- `tenant-provisioning`: creates the tenant's isolated database, runs
  migrations, seeds defaults, and activates the tenant (or records a failed
  provisioning state).
- `tenant-resolver`: resolves each incoming request to a tenant from its
  `Host` header and attaches the corresponding tenant database connection.
- `auth`: JWT + refresh-token authentication for platform/tenant users,
  cross-checked against the resolved tenant.
- `tenant-dashboard`: minimal authenticated admin shell a tenant owner sees
  after logging in.

### Modified Capabilities
- None — this is a fresh project with no existing specs.

## Impact

- New backend service (NestJS) implementing the modules above, connecting to
  both the Platform DB and per-tenant databases via Prisma.
- New Platform DB schema (tenant registry) and a Prisma migration template
  applied to every newly provisioned tenant database.
- New frontend admin shell (Next.js) covering login and the dashboard shell.
- No impact on existing code — none exists yet in this repo.
- Explicitly out of scope for this change: ecommerce data (products, orders,
  customers, inventory — Phase 2), branding/theme customization (Phase 3),
  custom domains and DNS/SSL verification (Phase 4), plans/subscriptions/
  billing (Phase 5), and production DevOps hardening (Phase 6).
