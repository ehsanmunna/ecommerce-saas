## Purpose

Gives storefront shoppers their own account, distinct from tenant
staff/admin users, so they can check out, save addresses, and see their
order history.

## ADDED Requirements

### Requirement: Customer registration
The system SHALL allow a new customer to register with an email and
password, scoped to a single tenant, and SHALL reject registration with an
email already used by another customer of that same tenant.

#### Scenario: Successful registration
- **WHEN** a customer registers with an email not already used in that
  tenant
- **THEN** a customer account is created for that tenant

#### Scenario: Duplicate email within a tenant
- **WHEN** a customer registers with an email already used by another
  customer of the same tenant
- **THEN** the registration is rejected

### Requirement: Customer login is scoped to the resolved tenant
The system SHALL authenticate a customer only against the resolved
tenant's own customer records, and SHALL issue a token that is only valid
for that tenant.

#### Scenario: Valid customer login
- **WHEN** a customer logs in with valid credentials on a request that
  resolved to their own tenant
- **THEN** the system issues a customer-scoped access token

#### Scenario: Customer token used against a different tenant
- **WHEN** a customer's access token is presented on a request that
  resolves to a different tenant
- **THEN** the request is rejected

### Requirement: Customer and staff identities are not interchangeable
The system SHALL NOT accept a customer access token on a staff/admin-only
route, and SHALL NOT accept a staff access token on a customer-only route.

#### Scenario: Customer token on a staff route
- **WHEN** a valid customer access token is presented to a staff/admin-only
  endpoint
- **THEN** the request is rejected

#### Scenario: Staff token on a customer route
- **WHEN** a valid staff access token is presented to a customer-only
  endpoint
- **THEN** the request is rejected

### Requirement: Customer profile
A customer SHALL be able to view and update their own profile, and SHALL
NOT be able to view or update another customer's profile.

#### Scenario: Viewing another customer's profile
- **WHEN** a customer requests another customer's profile by id
- **THEN** the request is rejected

### Requirement: Saved addresses
A customer SHALL be able to add and remove their own saved shipping
addresses.

#### Scenario: Adding a saved address
- **WHEN** a customer adds a shipping address to their account
- **THEN** that address is available for selection during checkout
