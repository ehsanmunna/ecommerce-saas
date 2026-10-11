## ADDED Requirements

### Requirement: Staff category update
The system SHALL expose a staff-only endpoint to update a category's name and slug.

#### Scenario: Staff updates a category
- **WHEN** a staff user with OWNER/ADMIN role submits a category update
- **THEN** the category is updated and the new values are reflected

#### Scenario: Unauthenticated or non-staff rejected
- **WHEN** an unauthenticated caller or a customer-role user attempts a category update
- **THEN** the request is rejected (401/403)
