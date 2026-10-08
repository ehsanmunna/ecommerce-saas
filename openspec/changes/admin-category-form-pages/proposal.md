## Why

The categories page currently embeds the create form inline, unlike the products page which uses separate new/edit pages. Category management should mirror the product management pattern.

## What Changes

- Add `/dashboard/categories/new` for creating a category.
- Add `/dashboard/categories/:id/edit` for editing a category (name/slug).
- `/dashboard/categories` becomes a pure list page (name, slug, product count) with "New category" and row "Edit" links.
- API: add `PATCH /categories/:id` (OWNER/ADMIN) via a new `updateCategory` service method; add `updateCategory` to the admin api-client.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `admin-category-management`: the categories page no longer hosts the create form inline; create/edit move to dedicated pages, mirroring product management.
- `product-catalog`: staff category API gains `PATCH /categories/:id`.

## Impact

- `apps/admin/app/dashboard/categories/page.tsx`: list-only; remove form.
- `apps/admin/app/dashboard/categories/new/page.tsx`: new create page.
- `apps/admin/app/dashboard/categories/[id]/edit/page.tsx`: new edit page.
- `apps/api/src/modules/catalog/catalog-admin.controller.ts` + `catalog.service.ts`: update category endpoint.
- `apps/admin/app/lib/api-client.ts`: `updateCategory`.
