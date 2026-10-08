## Why

The admin product create/edit forms only support name, description, price, and category. Store staff need the fuller product fields (sku, short description, regular/sale pricing, stock, image, status) to actually list catalog items.

## What Changes

- Tenant `Product` model gains: `sku` (unique per tenant), `shortDescription`, `regularPrice` (replaces `price`), `salePrice` (nullable), `stockQuantity`, `mainImage` (nullable URL), `status` (`active`/`draft`/`archived`; replaces `isActive`).
- Migration backfills: `regularPrice ← price`, `status ← is_active ? 'active' : 'draft'`, `stockQuantity ← 0`.
- API: `CreateProductDto`/`UpdateProductDto`/`ListProductsDto` and service include the new fields; storefront browse filters/sorts on `regularPrice` and `status = 'active'`.
- Admin: new/edit product forms include all fields; products table shows status and can display `mainImage`.
- `isActive` and `price` are removed from the Product model and API responses.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `admin-product-management`: create/edit forms and table include sku, shortDescription, regularPrice, salePrice, stockQuantity, mainImage, status.
- `product-catalog`: Product schema/API surface changes (regularPrice, salePrice, status, sku, stockQuantity, mainImage, shortDescription); storefront browse and staff list responses reflect them.

## Impact

- `prisma/tenant/schema.prisma`: Product model changes + migration.
- `apps/api/src/modules/catalog/*`: DTOs and service updated for new fields.
- `apps/api/src/modules/catalog/storefront-catalog.controller.ts` + service browse: ACTIVE filter becomes `status = 'active'`, price sort/filter on `regularPrice`.
- `apps/admin/app/dashboard/products/*` (list, new, edit): forms and table use new fields.
- Any other code reading `product.price` or `product.isActive` must be updated.
