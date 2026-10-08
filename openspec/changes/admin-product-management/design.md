## Context

See proposal.md - Why. Admin API endpoints exist for create/update/deactivate/variants/categories but no staff list endpoints; the storefront catalog controller serves browse traffic only and filters to active products. Admin pages live under `app/dashboard/*` with a `ComingSoon` component; API access goes through `app/lib/api-client.ts` with `x-tenant-slug` + Bearer token.

## Goals / Non-Goals

**Goals:**
- Two staff GET endpoints (`GET /products`, `GET /categories`) guarded by OWNER/ADMIN.
- Real products management UI at `/dashboard/products`, reusing the existing ComingSoon page location.

**Non-Goals:**
- Bulk import, image upload, inventory editing UI (inventory has its own module), orders/customers admin pages.
- Replacing the storefront catalog controller — it keeps serving storefront routes.

## Decisions

- **Separate staff list endpoints** rather than reusing storefront browse: storefront `GET /products` only returns active products and is public; staff need inactive products too, and staff routes must use the JWT guard. Alternative: add `?includeInactive=1` to the storefront route — rejected because it would expose inactive data on a public surface unless guarded, muddying both audiences.
- **List response shape**: mirror the storefront browse response (`{items, total, page, pageSize}` with category + variants included per product) so the admin UI can reuse mental models; inactive included by default for staff.
- **Admin UI as a single client page** with inline create/edit/deactivate forms (no modal library in the codebase); deactivate uses `POST /products/:id/deactivate` per the existing API rather than a new PATCH flag.

## Risks / Trade-offs

- [Risk] Staff list endpoint returns large catalogs → Mitigation: reuse pagination params from `BrowseProductsDto` (page/pageSize, capped).
- [Trade-off] No optimistic updates; page refetches after mutations → acceptable for staff tool.
