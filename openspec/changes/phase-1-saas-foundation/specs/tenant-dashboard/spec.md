## Purpose

Gives a newly onboarded tenant owner an authenticated home base right after
registering and logging in, confirming their tenant context before any
ecommerce features exist to manage.

## ADDED Requirements

### Requirement: Authenticated dashboard access
The system SHALL only render the tenant dashboard for a successfully
authenticated user, and SHALL redirect unauthenticated access attempts to
login without rendering dashboard content.

#### Scenario: Owner logs in successfully
- **WHEN** a tenant owner logs in with valid credentials
- **THEN** they are taken to the dashboard for their tenant

#### Scenario: Unauthenticated access attempt
- **WHEN** an unauthenticated request is made for the dashboard
- **THEN** the system redirects to login and does not return dashboard
  content

### Requirement: Tenant context display
The dashboard SHALL display the current tenant's name and slug so the user
can confirm which tenant/store they are managing.

#### Scenario: Dashboard loads for a tenant
- **WHEN** the dashboard loads for an authenticated user of tenant "Acme"
- **THEN** the tenant name "Acme" and its slug are visible on the page

### Requirement: Placeholder navigation for future phases
The dashboard SHALL present navigation entries for sections not yet
implemented (Products, Orders, Customers, Settings) as clearly-labeled
placeholders rather than broken links or errors.

#### Scenario: User selects an unimplemented section
- **WHEN** a user selects a navigation entry for a section not yet built
  (e.g. Products)
- **THEN** the system shows a "coming soon" state rather than a 404 or
  unhandled error
