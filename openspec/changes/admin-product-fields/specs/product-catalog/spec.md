## MODIFIED Requirements

### Requirement: Staff product listing
The system SHALL expose a staff-only endpoint listing the tenant's products, including inactive ones, with filters for category, active/inactive state, and name search, and pagination. Staff product responses SHALL include `sku`, `shortDescription`, `description`, `regularPrice`, `salePrice`, `stockQuantity`, `mainImage`, and `status`.

#### Scenario: Staff lists all products including inactive
- **WHEN** a staff user with OWNER/ADMIN role requests the product list
- **THEN** the response includes products of every status with their category, variant count, and new fields (sku, regularPrice, salePrice, stockQuantity, mainImage, status)

#### Scenario: Filter by active state and category
- **WHEN** a staff user filters the product list by category and active state
- **THEN** only matching products are returned

#### Scenario: Unauthenticated or non-staff rejected
- **WHEN** an unauthenticated caller or a customer-role user requests the staff product list
- **THEN** the request is rejected (401/403)

## ADDED Requirements

### Requirement: Product fields and lifecycle
The system SHALL store per product: `sku` (unique), `shortDescription`, `description`, `regularPrice`, nullable `salePrice`, `stockQuantity`, nullable `mainImage`, and `status` (`active`, `draft`, or `archived`). Storefront browsing SHALL only expose products with `status = 'active'`, and price filtering/sorting SHALL use `regularPrice`.

#### Scenario: Storefront shows only active products
- **WHEN** a public shopper requests the product list
- **THEN** only products with status `active` are returned

#### Scenario: Sale price present
- **WHEN** a product has a `salePrice`
- **THEN** the storefront/list responses expose both `regularPrice` and `salePrice`
