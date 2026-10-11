## ADDED Requirements

### Requirement: Staff product listing
The system SHALL expose a staff-only endpoint listing the tenant's products, including inactive ones, with filters for category, active/inactive state, and name search, and pagination.

#### Scenario: Staff lists all products including inactive
- **WHEN** a staff user with OWNER/ADMIN role requests the product list
- **THEN** the response includes both active and inactive products with their category and variant count

#### Scenario: Filter by active state and category
- **WHEN** a staff user filters the product list by category and active state
- **THEN** only matching products are returned

#### Scenario: Unauthenticated or non-staff rejected
- **WHEN** an unauthenticated caller or a customer-role user requests the staff product list
- **THEN** the request is rejected (401/403)

### Requirement: Staff category listing
The system SHALL expose a staff-only endpoint listing all categories of the tenant.

#### Scenario: Staff lists categories
- **WHEN** a staff user with OWNER/ADMIN role requests the category list
- **THEN** all categories with their product counts are returned
