## 1. Create page

- [x] 1.1 Add `apps/admin/app/dashboard/products/new/page.tsx` with the product create form (name, description, price, category selector), create via `createProduct`, redirect to `/dashboard/products`

## 2. Edit page

- [x] 2.1 Add `apps/admin/app/dashboard/products/[id]/edit/page.tsx`: load product via `listProducts` and find by id, edit form (name, description, price, category, isActive), save via `updateProduct`, redirect back
- [x] 2.2 Add add-variant form on the edit page via `createVariant`

## 3. Products page cleanup

- [x] 3.1 Remove inline create/edit form and add-variant form from the products page; "New product" links to `/dashboard/products/new`, "Edit" links to `/dashboard/products/:id/edit`

## 4. Verification

- [ ] 4.1 Typecheck admin app (done); manually verify create/edit/add-variant flows Typecheck admin app; manually verify create/edit/add-variant flows
