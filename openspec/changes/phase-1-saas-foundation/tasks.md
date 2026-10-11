## 1. Monorepo & Project Setup

- [x] 1.1 Scaffold the monorepo layout (`apps/api`, `apps/admin`,
      `packages/types`, `prisma/`) per the design doc's recommended
      structure. (`packages/config` was dropped — nothing in Phase 1 needs
      shared runtime config, and an empty package would just be dead
      scaffolding.)
- [x] 1.2 Initialize the NestJS app in `apps/api` with base modules folder
      structure (`modules/`, `common/`, `database/`)
- [x] 1.3 Initialize the Next.js app in `apps/admin` for the dashboard shell
- [x] 1.4 Set up local PostgreSQL (docker-compose) for the Platform DB and
      for provisioning tenant databases in dev

## 2. Platform Database & Prisma Setup

- [x] 2.1 Define the Platform DB Prisma schema: `tenants` table with `id`,
      `name`, `slug`, `database_name`, `database_host`, `database_port`,
      `status`, `created_at`, `updated_at`
- [x] 2.2 Write the initial Platform DB migration
- [x] 2.3 Define the tenant DB Prisma schema template (the schema every
      newly provisioned tenant database gets): `users`, `roles`,
      `settings`, `themes` (only what Phase 1 needs — no products/orders/etc.
      yet; a full `permissions` table was skipped in favor of a plain role
      name embedded in the JWT, since nothing in Phase 1 checks fine-grained
      permissions)
- [x] 2.4 Write the initial tenant DB migration set from the template

## 3. Tenant Connection Management

- [x] 3.1 Implement a bounded, evictable cache of tenant Prisma Client
      instances keyed by tenant id (per design.md's connection-management
      decision)
- [x] 3.2 Implement a lookup that resolves a tenant's DB connection info
      from its Platform DB record

## 4. Tenant Registration

- [x] 4.1 Implement the registration endpoint: validate company name, slug,
      owner email, plan
- [x] 4.2 Implement slug validation (format, reserved words, uniqueness
      against the Platform DB)
- [x] 4.3 On valid registration, create the tenant record with status
      `PROVISIONING` and invoke the provisioning workflow
- [x] 4.4 Implement a tenant status endpoint (`PROVISIONING` / `ACTIVE` /
      `PROVISIONING_FAILED`)

## 5. Tenant Provisioning

- [x] 5.1 Implement tenant database creation
- [x] 5.2 Implement running the tenant schema migration against the new
      database
- [x] 5.3 Implement seeding default roles, default settings, and default
      theme
- [x] 5.4 Implement owner account creation in the tenant database
- [x] 5.5 Implement failure handling: on any step failure, drop/mark the
      partial tenant database unusable and set tenant status to
      `PROVISIONING_FAILED`
- [x] 5.6 Implement idempotent retry of provisioning for a
      `PROVISIONING_FAILED` tenant (clean up partial resources first)
- [x] 5.7 On full success, mark tenant `ACTIVE`

## 6. Tenant Resolver

- [x] 6.1 Implement `Host`-header-based tenant resolution middleware,
      matching the default `<slug>.yoursaas.com` subdomain pattern.
      Mounted only on tenant-scoped routes (auth, `/me`) — tenant
      registration/status are platform-level and exempt (see the
      `tenant-resolver` spec and design.md updates made during
      implementation).
- [x] 6.2 Reject requests whose host does not match any registered tenant
- [x] 6.3 Reject requests resolving to a non-`ACTIVE` tenant
      (`PROVISIONING`, `PROVISIONING_FAILED`, `SUSPENDED`)
- [x] 6.4 Attach the resolved tenant's DB connection (via the connection
      cache from section 3) to the request context before any handler runs
- [x] 6.5 Add a dev-only host-override mechanism (`x-tenant-slug` header,
      disabled outside `NODE_ENV=production`) so tenant resolution is
      testable without real wildcard DNS

## 7. Authentication

- [x] 7.1 Implement login: verify credentials against the resolved
      tenant's user table
- [x] 7.2 Issue a JWT access token embedding `userId`, `tenantId`, `role`,
      plus a refresh token
- [x] 7.3 Implement an authentication guard that verifies access token
      signature/expiry
- [x] 7.4 Implement an authorization check that rejects a request when the
      access token's `tenantId` does not match the host-resolved tenant
- [x] 7.5 Implement refresh-token exchange (issue new access token given a
      valid, unexpired refresh token)
- [x] 7.6 Implement refresh token revocation/expiry handling

## 8. Tenant Dashboard Shell

- [x] 8.1 Implement login page in `apps/admin`
- [x] 8.2 Implement the authenticated dashboard route, redirecting
      unauthenticated visitors to login
- [x] 8.3 Display the current tenant's name and slug on the dashboard
- [x] 8.4 Add placeholder navigation entries (Products, Orders, Customers,
      Settings) with a "coming soon" state instead of broken links

## 9. Verification

- [x] 9.1 End-to-end test: register a tenant, confirm it reaches `ACTIVE`,
      log in as the owner, and reach the dashboard showing the correct
      tenant context (automated in `test/tenant-lifecycle.e2e-spec.ts`,
      plus manually verified through the running admin app)
- [x] 9.2 Test: registration with a duplicate or invalid slug is rejected
- [x] 9.3 Test: request to an unregistered or non-active tenant host is
      rejected
- [x] 9.4 Test: a valid token for tenant A is rejected on a request that
      resolves to tenant B
- [x] 9.5 Test: forcing a provisioning step to fail results in
      `PROVISIONING_FAILED` and a safely retryable state, not a stuck or
      partially-active tenant (unit-tested in
      `tenant-provisioning.service.spec.ts`; the successful-retry path was
      also verified live against a real provisioning failure)
