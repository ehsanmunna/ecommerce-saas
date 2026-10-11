## Context

See proposal.md - Why. `/dashboard/products` currently hosts an inline create/edit form and an inline add-variant form. Categories already have their own page at `/dashboard/categories`; this extends the same pattern to products.

## Goals / Non-Goals

**Goals:**
- `/dashboard/products/new` create page and `/dashboard/products/:id/edit` edit page (with add-variant).
- Products page reduced to table/filters/deactivate with navigation links.

**Non-Goals:**
- New API endpoints (existing `createProduct`/`updateProduct`/`createVariant` helpers suffice).
- Product detail page, delete action.

## Decisions

- **Edit page loads product from the list data via a fetch-by-id**: the API has no staff `GET /products/:id`; for the edit page we can pass the product through the list endpoint filtered by search, or simpler — fetch the full list and find by id. Chosen: reuse `listProducts` with a search filter fallback... Actually simplest robust approach: fetch `/products` (pageSize up to 100) and find by id; if not found show "not found". Alternative: add a staff GET /products/:id endpoint — rejected as unnecessary for this change's scope, note as future cleanup.
- **Variant form lives on edit page**: it needs the product id, so the edit page is the natural home.

## Risks / Trade-offs

- [Risk] Edit page needs the product and only has a list endpoint → fetch list, find by id; acceptable at staff-tool scale. Alternative documented above.
