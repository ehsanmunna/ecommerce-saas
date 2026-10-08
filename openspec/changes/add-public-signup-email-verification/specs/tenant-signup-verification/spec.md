## Purpose

Provides a verify-first tenant intake so a new company proves ownership of its owner email before any isolated tenant database is provisioned, replacing dev-only manual registration.

## ADDED Requirements

### Requirement: Verify-first tenant registration
The system SHALL accept a public tenant signup request (company name, slug, owner email, owner password, plan), validate it, create the tenant record with status `PENDING_VERIFICATION`, and send a verification email WITHOUT provisioning tenant infrastructure.

#### Scenario: Successful signup creates pending tenant and sends email
- **WHEN** a signup request is submitted with a unique valid slug and complete required fields
- **THEN** the system creates a tenant record with status `PENDING_VERIFICATION`, stores only a hash of the verification token (never plaintext), sets a token expiry, and dispatches a verification email containing a single-use verify link

#### Scenario: Duplicate slug rejected without side effects
- **WHEN** a signup request uses a slug that already belongs to any existing tenant regardless of status
- **THEN** the system rejects the request with a conflict error and creates no tenant record and sends no email

#### Scenario: Invalid or reserved slug rejected
- **WHEN** a signup request uses a slug with characters outside lowercase letters, digits, and hyphens, or a platform-reserved slug (e.g. `app`, `api`, `www`, `admin`)
- **THEN** the system rejects the request with a validation error and creates no tenant record

#### Scenario: No provisioning happens before verification
- **WHEN** a tenant is in `PENDING_VERIFICATION` status
- **THEN** the system SHALL NOT have created any tenant database, run any tenant migration, or seeded any tenant rows for it

### Requirement: Slug availability check
The system SHALL expose a public slug-availability check used by the signup form for live feedback.

#### Scenario: Available slug reported
- **WHEN** a client checks a slug that is validly formatted, not reserved, and not taken by any tenant
- **THEN** the system returns available true

#### Scenario: Unavailable slug reported
- **WHEN** a client checks a slug that is invalidly formatted, reserved, or already taken
- **THEN** the system returns available false with a reason code (invalid, reserved, taken)

### Requirement: Email verification triggers provisioning
The system SHALL verify a single-use token and, on success, transition the tenant from `PENDING_VERIFICATION` to provisioning and then to its final status.

#### Scenario: Valid token provisions tenant
- **WHEN** a client submits an unexpired verification token matching a `PENDING_VERIFICATION` tenant
- **THEN** the system marks the owner email verified, transitions the tenant to `PROVISIONING`, runs provisioning (database creation, migration, seeding), and returns the final status `ACTIVE` on success or `PROVISIONING_FAILED` on failure

#### Scenario: Expired token rejected
- **WHEN** a client submits a verification token after its expiry (24 hours by default)
- **THEN** the system rejects the request with an expired error and leaves the tenant in `PENDING_VERIFICATION` without provisioning

#### Scenario: Invalid or already-used token rejected
- **WHEN** a client submits an unknown token or replays a token that was already consumed
- **THEN** the system rejects the request with an invalid error and changes no tenant state

### Requirement: Verification email can be resent with throttling
The system SHALL allow resending the verification email for a `PENDING_VERIFICATION` tenant, rotating the token, subject to rate limiting.

#### Scenario: Resend rotates token and re-sends
- **WHEN** a resend is requested for a `PENDING_VERIFICATION` tenant after the throttle window (60 seconds) has passed
- **THEN** the system invalidates the previous token, issues a new token with a fresh expiry, and dispatches a new verification email

#### Scenario: Resend throttled
- **WHEN** a resend is requested within the throttle window of the last send
- **THEN** the system rejects the request with a rate-limit error and sends no email

#### Scenario: Resend for non-pending tenant rejected
- **WHEN** a resend is requested for a tenant that is not in `PENDING_VERIFICATION` status
- **THEN** the system rejects the request and sends no email

### Requirement: Unverified tenants cannot log in or serve traffic
The system SHALL gate all tenant-scoped access on the tenant reaching `ACTIVE`, so unverified tenants cannot authenticate or serve storefront traffic.

#### Scenario: Staff login blocked before verification
- **WHEN** a staff login is attempted against a tenant in `PENDING_VERIFICATION` status
- **THEN** the system rejects the request indicating the tenant is not active and the owner email must be verified first

#### Scenario: Status is queryable while pending
- **WHEN** a client queries tenant status for a `PENDING_VERIFICATION` tenant
- **THEN** the system returns `PENDING_VERIFICATION` without blocking or timing out
