## ADDED Requirements

### Requirement: Retrieve a single product's detail
The system SHALL allow retrieving a single product by its slug (or id),
including its variants, and SHALL only return this detail for active
products to unauthenticated browsing.

#### Scenario: Fetching an existing active product
- **WHEN** a client requests detail for an active product by its slug
- **THEN** the product's full detail, including its variants, is returned

#### Scenario: Fetching an inactive or unknown product
- **WHEN** a client requests detail for a product that is inactive or
  does not exist
- **THEN** the system returns a not-found response
