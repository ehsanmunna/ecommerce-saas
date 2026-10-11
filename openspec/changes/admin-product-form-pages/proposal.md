## Why

The products page currently embeds the create/edit product form and add-variant form inline, making the page crowded. Creation and editing deserve dedicated pages like the categories page.

## What Changes

- Add `/dashboard/products/new` for creating a product.
- Add `/dashboard/products/:id/edit` for editing a product.
- Move the add-variant form onto the edit page (contextual to the product being edited).
- Products page keeps the table, filters, deactivate, and row actions; row "Edit" navigates to the edit page and "New product" navigates to the create page.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `admin-product-management`: product creation and editing move from inline forms on `/dashboard/products` to dedicated `/dashboard/products/new` and `/dashboard/products/:id/edit` pages.

## Impact

- `apps/admin/app/dashboard/products/page.tsx`: remove inline form JSX/state, link out to new/edit.
- `apps/admin/app/dashboard/products/new/page.tsx`: new create page.
- `apps/admin/app/dashboard/products/[id]/edit/page.tsx`: new edit page with add-variant form.
