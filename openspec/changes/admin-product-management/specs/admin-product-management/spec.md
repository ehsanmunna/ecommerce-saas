## Purpose

Tenant staff manage their store's products, categories, and variants from the admin dashboard, without curl or direct DB access.

## ADDED Requirements

### Requirement: Products management page
The system SHALL render a products management page at `/dashboard/products` (replacing the ComingSoon stub) listing the tenant's products with name, price, category, active/inactive state, and variant count, with client-side controls to create, edit, deactivate, and add variants.

#### Scenario: Page lists products
- **WHEN** an authenticated staff user opens `/dashboard/products`
- **THEN** the page shows the tenant's products (active and inactive) in a table

#### Scenario: Create product from the page
- **WHEN** the staff user submits the create-product form with valid fields
- **THEN** the product is created via the admin API and appears in the table

#### Scenario: Deactivate product from the page
- **WHEN** the staff user deactivates a product
- **THEN** the product's status updates to inactive in the table without a full reload

#### Scenario: Unauthenticated access redirected
- **WHEN** an unauthenticated user navigates to `/dashboard/products`
- **THEN** they are redirected to login

### Requirement: Category management from the products page
The system SHALL let staff create categories from the products page, and product creation SHALL offer the tenant's existing categories for selection.

#### Scenario: Create category
- **WHEN** the staff user submits a new category name
- **THEN** the category is created and appears in the category selector for new products
