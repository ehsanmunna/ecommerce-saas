# Ecommerce SaaS

Multi-tenant ecommerce SaaS platform — one shared codebase, one isolated
PostgreSQL database per tenant. See
[`ecommerce-saas-multi-tenant-system-design.md`](ecommerce-saas-multi-tenant-system-design.md)
for the full architecture, and `openspec/changes/` for the specs behind
what's actually been built so far (Phase 1: tenant registration,
provisioning, tenant resolution, auth, and a basic dashboard shell).

## Repo layout

```
apps/
  api/      NestJS backend (Platform DB + per-tenant DBs, auth, provisioning)
  admin/    Next.js tenant admin dashboard
packages/
  types/    Shared TypeScript types (type-only, no runtime code)
prisma/
  platform/ Platform DB schema + migrations (tenant registry)
  tenant/   Tenant DB schema + migrations (template applied to every tenant)
docker-compose.yml   Local PostgreSQL for development
```

## Prerequisites

- Node.js 20+ and npm (this is an npm workspaces monorepo — always install
  from the repo root, never inside `apps/api` or `apps/admin` directly)
- Docker Desktop (used to run PostgreSQL locally; see [Database](#database))

## 1. Install dependencies

```bash
npm install
```

This installs all workspaces and (via `apps/api`'s `postinstall`) generates
both Prisma clients into `apps/api/node_modules/@prisma-clients/{platform,tenant}`.

## 2. Database

The platform database and every tenant database run on the same local
PostgreSQL server in development. It's containerized via
[`docker-compose.yml`](docker-compose.yml):

```bash
docker compose up -d postgres
```

This starts Postgres on **host port `55432`** (not the default `5432`) with
user `saas` / password `saas_dev_password` and a default `platform`
database — the non-standard port avoids clashing with any native Postgres
install already listening on `5432` on your machine (this bit us during
development; if `docker compose up` fails to bind or you can't connect,
check `netstat -ano | grep 5432` / `Get-Service *postgres*` for a
conflicting local install before assuming Docker is broken).

Stop it with `docker compose down` (add `-v` to also delete the data
volume).

## 3. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env.local
cp apps/storefront/.env.example apps/storefront/.env.local
```

The defaults in `apps/api/.env.example` already match the docker-compose
Postgres above. See that file for what each variable does (JWT secrets,
tenant DB admin credentials, the root domain used for subdomain-based
tenant resolution, etc.) — nothing needs to change for local dev.

`apps/storefront/.env.local` needs one edit: `NEXT_PUBLIC_DEV_TENANT_SLUG`
must be set to a tenant slug you've actually registered (see step 5) —
the placeholder value only works if that's the slug you used with
`POST /tenants/register`. Restart `npm run dev:storefront` after creating
or editing this file, since Next.js only reads env files at startup.
Skipping this step is the most common cause of the storefront failing
every request with `Unable to resolve tenant from request host` — that
error means no tenant slug reached the API at all, not that the slug was
wrong.

## 4. Apply the platform database migration

Tenant database migrations are applied automatically per-tenant during
provisioning (see `TenantMigrationService`) — you don't need to run them
by hand. The platform database, however, is set up once per environment:

```bash
cd apps/api
npm run prisma:migrate:platform:deploy
```

## 5. Run the apps

From the repo root, in two terminals:

```bash
npm run dev:api     # NestJS API on http://localhost:3001
npm run dev:admin   # Next.js admin dashboard on http://localhost:3000
```

Open `http://localhost:3000/login`. Since local dev has no real wildcard
DNS, tenant resolution uses a dev-only `x-tenant-slug` header instead of a
subdomain — the login form's "Store slug" field sends that header for you,
so nothing extra to configure.

To create a tenant to log into, call the registration endpoint directly:

```bash
curl -X POST http://localhost:3001/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Acme Inc",
    "slug": "acme",
    "ownerEmail": "owner@acme.test",
    "ownerPassword": "supersecret123",
    "plan": "BASIC"
  }'
```

This provisions a real, isolated `tenant_acme` database (roles, default
settings/theme, owner account) and returns once the tenant is `ACTIVE`. Then
sign in at `http://localhost:3000/login` with store slug `acme` and the
owner email/password above.

## API documentation

While `apps/api` is running outside a production config, interactive
OpenAPI docs are served at `http://localhost:3001/api/docs` (raw JSON at
`/api/docs-json`), generated from the DTOs and controllers so they stay
current automatically. They document the `x-tenant-slug` header and the
`Bearer` auth scheme needed to actually exercise tenant-scoped routes from
the "Try it out" UI.

Docs are disabled whenever `NODE_ENV=production`, to avoid handing a full
endpoint/schema map to unauthenticated visitors of a live deployment. Set
`ENABLE_API_DOCS=true` to force them on in a production-configured
environment anyway (e.g. a staging environment kept at production parity).

## Running tests

```bash
cd apps/api
npm run test          # unit tests
npm run test:e2e      # integration tests — needs Postgres running (step 2)
```

The e2e suite registers and provisions real tenants against the database
configured in `apps/api/.env`, so it's slower than a typical unit test run
(each test that provisions a tenant takes a few seconds).

## Running in Docker

Only **PostgreSQL** is containerized today (`docker compose up -d postgres`,
above) — `apps/api` and `apps/admin` run natively via `npm run dev:*` in
this phase. Containerizing the apps themselves (Dockerfiles, a full
`docker-compose.yml` stack, CI image builds) is scoped to a later phase
("Phase 6 — Production DevOps" in the architecture doc) and hasn't been
built yet. When it is, this section will document `docker compose up`
bringing up the whole stack.

## Troubleshooting

- **Docker Desktop isn't running** — `docker compose up` fails with a
  `dockerDesktopLinuxEngine` pipe error. Start Docker Desktop and wait for
  it to finish starting before retrying.
- **Port 5432 already in use** — a native PostgreSQL install (common on
  Windows) can silently take over `localhost:5432`, making Docker's
  published port unreachable even though `docker compose ps` shows it
  mapped. This is why the compose file uses `55432` instead; if you change
  it back to `5432`, make sure nothing else is already bound to it.
- **`PROVISIONING_FAILED` after registering a tenant** — check the API
  process logs; the failure reason is logged, and the tenant's database is
  automatically cleaned up. Retry with:
  `POST /tenants/:id/retry-provisioning`.
