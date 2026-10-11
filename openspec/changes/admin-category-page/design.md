## Context

See proposal.md - Why. Category creation currently lives inline on `/dashboard/products` alongside the product table/forms. Dashboard pages are client components under `app/dashboard/*`, sharing `api-client.ts` (with `listCategories`/`createCategory` helpers) and the `DashboardContext`/session setup established by the admin-product-management change.

## Goals / Non-Goals

**Goals:**
- Dedicated `/dashboard/categories` page: category list (name, slug, product count) and a create form.
- Sidebar nav entry for Categories.
- Remove the inline create-category form from the products page.

**Non-Goals:**
- Category edit/delete, slug auto-generation UX, reordering.
- Changes to the staff category API (`GET /categories` already returns `_count.products`).

## Decisions

- **Separate page over modal on products page**: matches the per-resource page layout already used for products/orders/customers/settings; keeps the products page focused on products.
- **Reuse existing api-client helpers**: `listCategories` (includes `_count.products` from the admin controller) and `createCategory` already exist; no new API surface needed.
- **Remove category form from products page entirely**: the product form keeps its category selector so category creation is single-sourced on the new page.

## Risks / Trade-offs

- [Risk] Users may not find the new page → Mitigation: sidebar nav entry.
- [Trade-off] Product creation now requires visiting Categories first if none exist → acceptable; empty-state hint on the products form selector.
