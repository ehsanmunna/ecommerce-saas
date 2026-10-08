## MODIFIED Requirements

### Requirement: Product create and edit pages
The system SHALL let staff create a product from `/dashboard/products/new` and edit a product (including adding variants) from `/dashboard/products/:id/edit`. The product form SHALL include name, sku, categoryId, shortDescription, description, regularPrice, salePrice, stockQuantity, mainImage, and status. After a successful save, the user SHALL be returned to `/dashboard/products`.

#### Scenario: Create product from the page
- **WHEN** the staff user submits the create-product form with valid fields (name, sku, categoryId, shortDescription, description, regularPrice, salePrice, stockQuantity, mainImage, status)
- **THEN** the product is created via the admin API and the user is redirected to `/dashboard/products`

#### Scenario: Edit product from the page
- **WHEN** the staff user submits updates on the edit page
- **THEN** the product is updated via the admin API and the user is redirected to `/dashboard/products`

#### Scenario: Add variant from the edit page
- **WHEN** the staff user submits the add-variant form on the edit page
- **THEN** the variant is created and the product's variant count reflects it on return to the list

### Requirement: Products management page
The system SHALL render a products management page at `/dashboard/products` (replacing the ComingSoon stub) listing the tenant's products with name, price, category, active/inactive state, and variant count, with controls to filter, deactivate, and navigate to create/edit pages.

#### Scenario: Page lists products
- **WHEN** an authenticated staff user opens `/dashboard/products`
- **THEN** the page shows the tenant's products (active and inactive) in a table

#### Scenario: Navigate to create product
- **WHEN** the staff user clicks "New product"
- **THEN** they are taken to `/dashboard/products/new`

#### Scenario: Navigate to edit product
- **WHEN** the staff user clicks "Edit" on a row
- **THEN** they are taken to `/dashboard/products/:id/edit`

#### Scenario: Deactivate product from the page
- **WHEN** the staff user deactivates a product
- **THEN** the product's status updates to inactive in the table without a full reload

#### Scenario: Unauthenticated access redirected
- **WHEN** an unauthenticated user navigates to `/dashboard/products`
- **THEN** they are redirected to login
