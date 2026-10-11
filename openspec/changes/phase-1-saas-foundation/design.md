## Context

Greenfield project — see `proposal.md` (Why) for motivation. This is the
first change in the repo, implementing the NestJS + Next.js + PostgreSQL +
Prisma stack the architecture doc recommends, using the
database-per-tenant model. There is no existing code, so this design
focuses on the foundational shape that later phases (ecommerce data,
branding, custom domains, billing) will build on without requiring a
rewrite.

## Goals / Non-Goals

**Goals:**
- Define the Platform DB schema and the tenant DB schema/migration template
  used by every provisioned tenant.
- Define the tenant connection-management approach so it doesn't need to be
  redesigned once tenant count grows past a handful.
- Define the request pipeline order (tenant resolution → authentication →
  authorization) that every later capability will sit behind.
- Keep Phase 1 infrastructure minimal: no queue/worker, no Kubernetes, no
  DNS/SSL automation.

**Non-Goals:**
- Asynchronous provisioning via a job queue (RabbitMQ) — the design doc
  calls this out as a later scaling step, not a Phase 1 requirement.
- Custom domains, DNS verification, and SSL automation (Phase 4).
- Plans, subscriptions, and billing fields on the tenant record (Phase 5) —
  the Platform DB schema here is intentionally narrower than the doc's
  full example schema.
- Any ecommerce data model (products, orders, customers, inventory —
  Phase 2) or branding/theme customization (Phase 3).

## Decisions

### Synchronous provisioning, no queue yet
Provisioning (create DB → migrate → seed → create owner → activate) runs
in-process as part of handling the registration request, with each step
wrapped so failure triggers cleanup (see Risks below).
**Alternative considered**: async worker via RabbitMQ, as the doc suggests
for scale. Rejected for Phase 1 — it adds a queue, a worker process, and a
job-status-polling contract before there's any tenant volume to justify it.
Revisit once provisioning latency or tenant volume makes synchronous
handling impractical.

### Minimal Platform DB schema
The tenant record carries only what Phase 1 needs: `id`, `name`, `slug`,
`database_name`, `database_host`, `database_port`, `status`, `created_at`,
`updated_at`. No `plan_id` or billing-related columns.
**Alternative considered**: including the doc's full example schema
(`plan_id`, etc.) up front. Rejected — those fields belong to the Phase 5
capability that actually implements plans/billing; adding them now means
either leaving them unused or inventing plan semantics this change doesn't
own.

### Bounded, evictable tenant database connections
Tenant database connections are managed through a bounded cache (e.g. an
LRU of Prisma Client instances keyed by tenant id) rather than one
permanently-open client per tenant.
**Alternative considered**: one long-lived Prisma Client per tenant,
created on first use and never evicted. Rejected — this hits Postgres
`max_connections` as tenant count grows, since each client holds its own
pool; building the eviction interface now avoids a breaking change to the
connection-management API later, even though Phase 1's tenant count won't
stress it yet.

### Tenant resolution middleware is scoped to tenant-facing routes only
The `TenantResolverMiddleware` is mounted only on tenant-scoped route groups
(auth, `/me`/dashboard). Platform-level routes — tenant registration and
the tenant status-check endpoint — are excluded, since a brand-new tenant
being registered has no host to resolve against yet.
**Alternative considered**: applying the middleware globally to every
route. Rejected once implementation showed it would make tenant
registration itself unreachable (there is no tenant to resolve before one
is created). The `tenant-resolver` spec was updated to state this
exemption explicitly rather than leaving it as an undocumented gap.

### Request pipeline order: resolve → authenticate → authorize
Every request runs: tenant resolution middleware (from `Host`) → an
authentication guard (verifies JWT signature/validity where a token is
present) → an authorization check (JWT `tenantId` must equal the
host-resolved tenant's id, plus role check) → handler. Tenant resolution
always runs first because it is framework-level middleware, ahead of any
guard.
This reads as a re-ordering of the design doc's section 26 diagram
(Authentication → Tenant Resolution → Authorization), but preserves its
actual intent: no request reaches business logic on the strength of a
client-supplied identifier alone, and a token is only trusted once it's
been checked against the independently-resolved tenant. The doc's diagram
describes logical concerns, not literal middleware order; login itself
requires tenant resolution before authentication (there's no token yet to
authenticate against), which only fits placing resolution first.

### Provisioning failure handled as explicit compensation, not a saga framework
Each provisioning step is wrapped so a failure past database creation
triggers cleanup (drop the tenant database) and the tenant is left in
`PROVISIONING_FAILED`, not a formal saga/orchestration framework.
**Alternative considered**: adopting a workflow orchestrator (e.g.
Temporal). Rejected as disproportionate to Phase 1's four-or-five-step
provisioning sequence; reconsider only if the provisioning flow grows
substantially more steps or needs cross-service coordination.

## Risks / Trade-offs

- **[Risk]** Synchronous provisioning blocks the registration request for
  as long as database creation + migration + seeding take.
  → **Mitigation**: keep the Phase 1 tenant schema small so this stays
  fast; move to an async worker if step duration or tenant volume grows.
- **[Risk]** A backend crash mid-provisioning could leave a tenant stuck in
  `PROVISIONING` indefinitely, with no automatic reaper.
  → **Mitigation**: provisioning is designed to be safely retried (see
  `tenant-provisioning` spec's idempotent-retry requirement); a manual/admin
  retry action is sufficient for Phase 1's expected volume.
- **[Risk]** The bounded connection cache adds complexity that Phase 1's
  small tenant count won't exercise.
  → **Mitigation**: accepted deliberately so the connection-management
  interface doesn't change shape once tenant count grows.
- **[Risk]** No real wildcard DNS or custom-domain support means the
  resolver can only be exercised via subdomain-style hosts in dev/staging.
  → **Mitigation**: acceptable — custom domains are explicitly Phase 4;
  local/staging testing can use host-header overrides instead of real DNS.

## Open Questions

- Which specific auth library/pattern (e.g. Passport-JWT vs. hand-rolled
  guards) implements the `auth` spec — an implementation choice that
  doesn't change the spec, design approach, or task breakdown, safely left
  to task execution.
