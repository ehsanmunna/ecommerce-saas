## Context

See `proposal.md` (Why) for motivation. `apps/api` is a NestJS app whose
DTOs already carry `class-validator` decorators
(`RegisterTenantDto`, `LoginDto`, `RefreshTokenDto`), and whose tenant-scoped
routes (`/auth/*`, `/me`) depend on a `x-tenant-slug` dev-header or a real
subdomain plus a `Bearer` JWT — conventions that aren't discoverable from a
generated schema alone.

## Goals / Non-Goals

**Goals:**
- Serve accurate, low-maintenance API docs that stay in sync with the DTOs
  and controllers as they evolve, without hand-maintaining a separate spec
  file.
- Make the tenant-scoped request conventions (header, bearer auth)
  explicit enough to actually drive requests from the docs UI.

**Non-Goals:**
- Publishing docs externally or generating a client SDK from the OpenAPI
  output — out of scope until there's an actual consumer for one.
- Documenting the admin frontend (`apps/admin`) — this change is
  API-only.

## Decisions

### Mount docs at `/api/docs` (UI) and `/api/docs-json` (OpenAPI JSON)
Keeps documentation under an `/api` prefix rather than the bare root, so it
doesn't collide with whatever the root path ends up serving later (there's
no global route prefix configured yet, but reserving the root namespace
keeps that option open).

### Gate docs on `NODE_ENV`, not a separate feature flag
Docs are served whenever `NODE_ENV !== 'production'`, mirroring how the
`TenantResolverMiddleware`'s `x-tenant-slug` dev-override header is already
gated (`apps/api/src/common/middleware/tenant-resolver.middleware.ts`).
**Alternative considered**: a dedicated `ENABLE_API_DOCS` flag defaulting to
`false` everywhere. Rejected — it would require every non-production
environment to remember to set it, for no real benefit over reusing the
distinction the codebase already makes. An explicit `ENABLE_API_DOCS=true`
override is still supported for the rare case docs need to be turned on in
a production-configured environment (e.g. a staging environment that sets
`NODE_ENV=production` for parity testing).

### Use `@nestjs/swagger`'s CLI plugin for baseline schema accuracy
Enable the plugin in `nest-cli.json` so DTO shapes and required/optional
flags are inferred from the existing TypeScript types and
`class-validator` decorators, rather than hand-duplicating every field with
`@ApiProperty()`. Targeted `@ApiProperty({ description, example })` calls
are added only where a human description genuinely adds information the
type can't express (e.g. the slug format rule, minimum password length) —
not on every field.
**Alternative considered**: manually decorating every DTO field. Rejected
as pure duplication of information the CLI plugin already derives, and a
second place to forget to update when a DTO changes.

### Document tenant conventions with `@ApiHeader` and `@ApiBearerAuth`
The `x-tenant-slug` header is documented via `@ApiHeader(...)` on the
controllers that actually consume it (`AuthController`, `MeController`) —
not globally, since tenant registration/status endpoints don't use it.
Bearer auth is declared once via `DocumentBuilder.addBearerAuth()` in the
Swagger config and applied per-route with `@ApiBearerAuth()` on `/me` (and
any future protected route), enabling Swagger UI's "Authorize" flow.

## Risks / Trade-offs

- **[Risk]** The CLI plugin changes what runs during `nest build`/`nest
  start` (it transforms DTO classes to inject schema metadata).
  → **Mitigation**: unit/e2e tests run through `ts-jest`, not the Nest CLI
  transform, so they're unaffected; verify `nest build`,
  `npm run test`, and `npm run test:e2e` still pass after enabling it.
- **[Risk]** Forgetting to set `NODE_ENV=production` in a real production
  deployment would leave docs (and the existing `x-tenant-slug` override)
  exposed.
  → **Mitigation**: this is an existing operational assumption, not a new
  one introduced by this change; call it out in the README's deployment
  notes rather than inventing a second, separately-forgettable flag.
- **[Risk]** Swagger UI's "Authorize" dialog only captures the bearer
  token, not the `x-tenant-slug` header — a user must still fill that
  header in per-request via "Try it out".
  → **Mitigation**: minor UX friction, not a functional gap; the
  `@ApiHeader` documentation makes the requirement visible even though it
  isn't pre-filled.

## Migration Plan

Purely additive: a new dev dependency (`@nestjs/swagger`), a new route
group, and decorator metadata on existing DTOs/controllers. No database
changes, no breaking changes to existing endpoints. Rollback is deleting
the dependency and the `SwaggerModule.setup(...)` call.
