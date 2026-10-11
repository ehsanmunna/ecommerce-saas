## Purpose

Gives prospective store owners a public self-serve signup flow in the admin app so they can register, verify their email, and reach login without developer-issued curl commands.

## ADDED Requirements

### Requirement: Public signup page
The system SHALL provide a public `/signup` page in the admin app that collects company name, slug, owner email, password, and plan, validates input, and submits a tenant signup request.

#### Scenario: Successful signup submission
- **WHEN** a visitor completes all fields with valid input and submits
- **THEN** the system creates a `PENDING_VERIFICATION` tenant via the API and navigates to the check-email interstitial for that tenant

#### Scenario: Live slug feedback
- **WHEN** a visitor types a slug into the signup form
- **THEN** the system shows inline availability feedback (available, taken, reserved, or invalid) within 1 second of pausing input, debouncing API checks

#### Scenario: Validation errors shown inline
- **WHEN** a visitor submits with a missing field, malformed email, short password (under 8 chars), or invalid slug
- **THEN** the system shows inline field errors and submits nothing

### Requirement: Check-email interstitial with resend
The system SHALL show a check-email interstitial after signup that confirms where the verification link was sent and allows resending.

#### Scenario: Interstitial shows destination and resend
- **WHEN** a visitor lands on the check-email page after a successful signup
- **THEN** the system displays the owner email address, explains the link expires in 24 hours, and offers a resend button with a visible 60-second cooldown

#### Scenario: Resend surfaces throttle feedback
- **WHEN** a visitor clicks resend within the cooldown window
- **THEN** the system shows the remaining wait time and sends no duplicate request

### Requirement: Verify-email page provisions and routes
The system SHALL provide a public `/verify-email` page that consumes the `token` query parameter, verifies it, polls provisioning status, and routes the owner onward.

#### Scenario: Valid token reaches login
- **WHEN** a visitor opens the verify link with a valid unexpired token
- **THEN** the system shows a verifying-then-provisioning progress state, and on `ACTIVE` shows success with a login link pre-filled with the tenant slug

#### Scenario: Provisioning failure is recoverable
- **WHEN** verification succeeds but provisioning ends in `PROVISIONING_FAILED`
- **THEN** the system shows a failure state with a retry action and a support contact, rather than a dead end

#### Scenario: Expired or invalid token shows recovery
- **WHEN** a visitor opens a verify link with an expired, unknown, or already-used token
- **THEN** the system shows an expired/invalid state with a resend action (requiring the tenant identifier) and does not navigate to login

### Requirement: Public auth routes stay accessible
The system SHALL keep `/signup`, `/signup/check-email`, and `/verify-email` reachable without a session, and SHALL NOT redirect them to `/login`.

#### Scenario: Logged-out visitor reaches signup
- **WHEN** a logged-out visitor opens `/signup` or a verify link
- **THEN** the system renders the requested page instead of redirecting to login

#### Scenario: Logged-in owner is not blocked from signup pages
- **WHEN** an authenticated owner opens a verify link (e.g. on a second device state)
- **THEN** the system still processes the token normally
