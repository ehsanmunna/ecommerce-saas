## 1. Setup

- [x] 1.1 Add `@nestjs/swagger` as a dependency of `apps/api`
- [x] 1.2 Enable the `@nestjs/swagger` CLI plugin in `apps/api/nest-cli.json`

## 2. Bootstrap the docs endpoint

- [x] 2.1 Build a `DocumentBuilder` config in `main.ts` (title, description,
      version, `addBearerAuth()`)
- [x] 2.2 Gate `SwaggerModule.setup('api/docs', ...)` behind
      `NODE_ENV !== 'production'` or an explicit `ENABLE_API_DOCS=true`
      override (per design.md)
- [ ] 2.3 Confirm the OpenAPI JSON is reachable at `/api/docs-json`

## 3. Annotate DTOs

- [x] 3.1 Add `@ApiProperty` with a description/example to
      `RegisterTenantDto` fields where the type alone doesn't convey the
      constraint (slug format, password minimum length)
- [x] 3.2 Add `@ApiProperty` with a description/example to `LoginDto`
- [x] 3.3 Add `@ApiProperty` with a description/example to
      `RefreshTokenDto`

## 4. Annotate controllers

- [x] 4.1 Add `@ApiTags('tenants')` and `@ApiOperation`/`@ApiResponse` to
      `TenantController` routes
- [x] 4.2 Add `@ApiTags('auth')`, `@ApiHeader` for `x-tenant-slug`, and
      `@ApiOperation`/`@ApiResponse` to `AuthController` routes
- [x] 4.3 Add `@ApiTags('me')`, `@ApiBearerAuth()`, `@ApiHeader` for
      `x-tenant-slug`, and `@ApiOperation`/`@ApiResponse` to `MeController`
- [x] 4.4 Add `@ApiTags('health')` to `HealthController`

## 5. Verification

- [x] 5.1 `nest build` succeeds with the CLI plugin enabled
- [x] 5.2 `npm run test` and `npm run test:e2e` still pass unchanged
- [x] 5.3 With the app running outside production config, confirm
      `/api/docs` renders and lists every endpoint, and `/api/docs-json`
      returns a valid OpenAPI document
- [x] 5.4 From the docs UI, exercise a tenant-scoped flow end-to-end
      (register a tenant via curl, then use "Try it out" on `/auth/login`
      with the documented `x-tenant-slug` header, then "Authorize" with the
      returned token and call `/me`) to confirm the documented conventions
      actually work. (Verified the underlying requests directly, matching
      exactly what Swagger UI's "Try it out" would send — no headless
      browser was available in this environment to click through the UI
      itself.)
- [x] 5.5 Confirm that running with `NODE_ENV=production` (and no
      `ENABLE_API_DOCS` override) makes `/api/docs` and `/api/docs-json`
      unavailable (verified both the disabled default and the
      `ENABLE_API_DOCS=true` override re-enabling it)
- [x] 5.6 Update `README.md` to mention the docs endpoint and how it's
      gated
