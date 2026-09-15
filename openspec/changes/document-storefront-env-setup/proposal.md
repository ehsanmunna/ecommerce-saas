## Why

`add-storefront-frontend` shipped `apps/storefront/.env.example` but never
created a matching `.env.local`, and README's setup steps (which do cover
`apps/api/.env` and `apps/admin/.env.local`) were never extended to mention
it. Running the storefront without that file means
`NEXT_PUBLIC_DEV_TENANT_SLUG` is unset, so no `x-tenant-slug` header is ever
sent, and every tenant-scoped request fails with a generic
`Unable to resolve tenant from request host` — a confusing error for a
missing setup step, not a bug in tenant resolution itself. This surfaced
when testing the storefront locally (categories was the first call
noticed, but every storefront request was equally affected).

## What Changes

- Add a step to README's setup instructions for
  `cp apps/storefront/.env.example apps/storefront/.env.local`, alongside
  the existing `apps/api/.env` and `apps/admin/.env.local` steps.
- Document that `NEXT_PUBLIC_DEV_TENANT_SLUG` must be set to a tenant slug
  that has actually been registered (the placeholder value, `acme`, only
  works if that's the slug used with `POST /tenants/register`), and that
  `npm run dev:storefront` needs restarting after creating or editing the
  file.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — this is a documentation-only fix with no change in system
behavior. `.openspec.yaml` sets `skip_specs: true`.

## Impact

- `README.md`: one new step in the local setup instructions.
- No code, API, schema, or dependency changes.
