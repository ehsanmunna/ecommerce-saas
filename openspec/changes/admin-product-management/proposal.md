## Why

The catalog admin API already supports creating products, categories, and variants (plus update/deactivate), and the storefront exposes browsing — but the tenant admin app has a `ComingSoon` stub at `/dashboard/products`. Store staff cannot manage their catalog from the UI, and there is no staff-facing listing endpoint that includes inactive products.

## What Changes

- Add staff list endpoints to the catalog admin controller: `GET /products` (all products including inactive, with category, search, and active filters) and `GET /categories`.
- Replace the `/dashboard/products` stub with a real management page: product table (name, price, category, status, variants), create product form, edit, deactivate, add variant, create category.
- Add product API helpers to the admin app's `api-client.ts`.

## Capabilities

### New Capabilities
- `admin-product-management`: tenant staff UI for managing products/categories/variants from `/dashboard/products`.

### Modified Capabilities
- `product-catalog`: add staff-facing product/category listing endpoints (including inactive products).

## Impact

- `apps/api/src/modules/catalog/catalog-admin.controller.ts` + `catalog.service.ts`: two new GET endpoints.
- `apps/admin/app/dashboard/products/page.tsx`: full management UI replacing ComingSoon.
- `apps/admin/app/lib/api-client.ts`: product/category helpers.
