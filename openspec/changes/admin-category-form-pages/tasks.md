## 1. API

- [x] 1.1 Add `updateCategory` to `CatalogService` and `PATCH /categories/:id` to `CatalogAdminController` (OWNER/ADMIN), with `UpdateCategoryDto`

## 2. Admin UI

- [x] 2.1 Add `updateCategory` to `apps/admin/app/lib/api-client.ts`
- [x] 2.2 Strip inline create form from `/dashboard/categories`; make it a table with "New category" and row "Edit" links
- [x] 2.3 Add `/dashboard/categories/new/page.tsx` create form, redirect to list on save
- [x] 2.4 Add `/dashboard/categories/[id]/edit/page.tsx` edit form (load list, find by id), redirect on save

## 3. Verification

- [x] 3.1 Typecheck API + admin (done); manually verify create/edit flows
