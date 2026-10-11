## 1. Schema

- [x] 1.1 Update tenant `Product` model in `prisma/tenant/schema.prisma`: add `sku`, `shortDescription`, `regularPrice`, `salePrice`, `stockQuantity`, `mainImage`, `status`; remove `price`, `isActive`
- [x] 1.2 Write migration with backfill (`regularPrice ← price`, `status ← is_active ? 'active' : 'draft'`, stockQuantity default 0, sku fallback from product id)
- [ ] 1.3 Regenerate tenant client and apply migration

## 2. API

- [x] 2.1 Update `CreateProductDto`/`UpdateProductDto`/`ListProductsDto` with new fields; add `status` filter (`active`/`draft`/`archived`/all) to staff list; map deactivate to `status = 'archived'`
- [x] 2.2 Update `CatalogService` create/update/list/browse to new fields; storefront `isActive: true` → `status: 'active'`, price sort/filters → `regularPrice`
- [x] 2.3 Update any other consumers of `product.price`/`product.isActive` (seeds, storefront app, tests)

## 3. Admin UI

- [x] 3.1 Add all fields to `/dashboard/products/new` and `/dashboard/products/:id/edit` forms
- [x] 3.2 Update products table (status column from `status` field, keep variant count/category) and api-client types

## 4. Verification

- [ ] 4.1 Typecheck API + admin; run API tests; manually verify create/edit/list + storefront browse only shows active products
