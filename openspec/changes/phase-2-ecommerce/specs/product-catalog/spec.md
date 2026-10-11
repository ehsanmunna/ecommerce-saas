## Purpose

Lets a tenant organize and expose the products and categories that
customers browse, with enough search, filter, sort, and pagination to
make a real shop usable rather than a flat product list.

## ADDED Requirements

### Requirement: Create and manage products
The system SHALL allow a tenant to create a product with a name,
description, price, category, and active/inactive state, and SHALL reject
creation when required fields are missing or invalid.

#### Scenario: Valid product creation
- **WHEN** a product is created with a name, price, and category
- **THEN** the product exists and is returned in that category's listing

#### Scenario: Missing required field rejected
- **WHEN** a product is created without a name or without a price
- **THEN** the system rejects the request with a validation error

### Requirement: Organize products into categories
The system SHALL allow products to be assigned to a category, and SHALL
return only the products assigned to a category when that category is
browsed.

#### Scenario: Browsing a category
- **WHEN** a client requests products in the "Electronics" category
- **THEN** only products assigned to "Electronics" are returned

### Requirement: Product variants
The system SHALL allow a product to define one or more variants (e.g. by
size or color), each with its own SKU, and SHALL treat each variant as a
distinct purchasable and stockable unit.

#### Scenario: Ordering a specific variant
- **WHEN** a customer adds a specific size/color variant of a product to
  their cart
- **THEN** that exact variant (not just the parent product) is what gets
  added, priced, and tracked

### Requirement: Browse, search, filter, sort, and paginate products
The system SHALL support keyword search, filtering (at minimum by category
and price range), sorting (at minimum by price and by newest), and
pagination over the product listing. Only active products SHALL be
returned to browsing/search.

#### Scenario: Keyword search
- **WHEN** a client searches for a keyword that matches a product's name
- **THEN** that product appears in the results

#### Scenario: Filter by price range
- **WHEN** a client filters products by a minimum and maximum price
- **THEN** only products within that price range are returned

#### Scenario: Inactive products excluded
- **WHEN** a product has been marked inactive
- **THEN** it is excluded from browsing and search results

#### Scenario: Paginating a large catalog
- **WHEN** a client requests a page of products with a page size smaller
  than the total catalog
- **THEN** the response contains only that page's worth of products, and
  requesting the next page returns the next distinct set
