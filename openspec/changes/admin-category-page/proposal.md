## Why

Category creation is currently embedded in the products page, cluttering the product management workflow. Store staff need a dedicated place to view and manage categories.

## What Changes

- Add a dedicated `/dashboard/categories` page in the admin app listing all categories (with product counts) and a create-category form.
- Add a "Categories" link to the dashboard sidebar navigation.
- **BREAKING (UI only)**: Remove the create-category form and category controls from `/dashboard/products`; the product form still uses existing categories for selection.

## Capabilities

### New Capabilities
- `admin-category-management`: tenant staff UI for listing and creating categories from a dedicated `/dashboard/categories` page.

### Modified Capabilities
- `admin-product-management`: the products page no longer includes category creation; category management moves to its own page.

## Impact

- `apps/admin/app/dashboard/categories/page.tsx`: new page.
- `apps/admin/app/dashboard/layout.tsx`: add Categories nav item.
- `apps/admin/app/dashboard/products/page.tsx`: remove create-category form.
