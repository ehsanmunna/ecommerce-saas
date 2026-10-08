## 1. API

- [x] 1.1 Add `listProducts(tenantDb, query)` to `catalog.service.ts`: all products including inactive, filters for categorySlug/search/isActive, pagination, include category + variants
- [x] 1.2 Add `GET /products` and `GET /categories` to `catalog-admin.controller.ts` (OWNER/ADMIN guard), reusing `BrowseProductsDto`-style query params

## 2. Admin UI

- [x] 2.1 Add product/category helpers to `apps/admin/app/lib/api-client.ts`: listProducts, listCategories, createCategory, createProduct, updateProduct, deactivateProduct, createVariant
- [x] 2.2 Replace `/dashboard/products` ComingSoon stub with a products table (name, price, category, status, variant count) + search/category/active filters
- [x] 2.3 Add create/edit product form and add-variant form to the products page
- [x] 2.4 Add create-category control and wire categories into the product form's selector
- [x] 2.5 Deactivate action from the row, with table refresh after mutations

## 3. Verification

- [x] 3.1 Typecheck API and admin app; manually verify list/create/deactivate flow on /dashboard/products
