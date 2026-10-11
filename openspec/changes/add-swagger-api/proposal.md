## Why

The API (`apps/api`) currently has no interactive documentation — the only
way to discover its endpoints, request/response shapes, and the
`x-tenant-slug` dev-header requirement is to read controller source or the
OpenSpec behavior specs. As more endpoints get added in later phases, that
gap will only get more expensive for anyone (including future us)
integrating against the API. Adding Swagger/OpenAPI docs now, while the
surface is still small, keeps it cheap to keep current.

## What Changes

- Wire `@nestjs/swagger`'s `SwaggerModule` into `apps/api`, serving
  interactive API docs at `/api/docs` (and the raw OpenAPI JSON at
  `/api/docs-json`).
- Annotate existing DTOs (`RegisterTenantDto`, `LoginDto`,
  `RefreshTokenDto`) with `@ApiProperty` so generated docs show real field
  descriptions/examples, not just bare shapes.
- Annotate controllers (`TenantController`, `AuthController`,
  `MeController`, `HealthController`) with `@ApiTags` and response-shape
  decorators so docs group logically and show example responses.
- Document the `x-tenant-slug` dev-only header (via `@ApiHeader`) on every
  tenant-scoped route, and the `Authorization: Bearer` scheme (via
  `@ApiBearerAuth`) on JWT-protected routes — otherwise Swagger UI's
  "Try it out" is unusable against this API's actual request pipeline.
- Docs are served only when `NODE_ENV !== 'production'` by default (see
  design.md for the reasoning), matching how the existing `x-tenant-slug`
  dev-override header is already gated.

## Capabilities

### New Capabilities
- `api-docs`: interactive, always-current OpenAPI documentation for the
  backend API, including the tenant-scoped request conventions
  (`x-tenant-slug` header, bearer auth) specific to this system.

### Modified Capabilities
- None — this adds a documentation surface and metadata annotations; it
  does not change any existing endpoint's validation, authentication, or
  business-logic behavior.

## Impact

- `apps/api/src/main.ts`: bootstraps `SwaggerModule`.
- `apps/api/src/modules/**/dto/*.ts`: gain `@ApiProperty` decorators.
- `apps/api/src/modules/**/*.controller.ts`, `health.controller.ts`: gain
  `@ApiTags`/`@ApiOperation`/`@ApiResponse`/`@ApiHeader`/`@ApiBearerAuth`
  decorators.
- New dependency: `@nestjs/swagger` (plus its peer, `swagger-ui-express`,
  which `@nestjs/swagger` already depends on) in `apps/api`.
- No database, migration, or frontend changes.
