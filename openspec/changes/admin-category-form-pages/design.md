## Context

See proposal.md - Why. Categories page currently renders list + inline create form. Products use separate `/new` and `/:id/edit` pages plus an api-client with `createProduct`/`updateProduct`; categories lack an update endpoint/helper.

## Goals / Non-Goals

**Goals:**
- Categories list page mirrors products list page (table + New/Edit links).
- `/dashboard/categories/new` and `/dashboard/categories/:id/edit` pages.
- `PATCH /categories/:id` admin endpoint + `updateCategory` api-client helper.

**Non-Goals:**
- Category delete.
- Server-side category fetch by id (edit page loads list and finds by id, same as product edit).

## Decisions

- **Reuse products-page patterns** for form state, redirects, and error display: consistent UX, minimal new concepts.
- **Add `UpdateCategoryDto`** with optional name/slug, both validated like create.

## Risks / Trade-offs

- [Risk] Editing a category slug breaks storefront links by slug → accepted; slug changes are intentional admin actions for now.
