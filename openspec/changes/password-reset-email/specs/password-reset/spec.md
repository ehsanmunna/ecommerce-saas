## Purpose

Provides self-service password reset via email for all authentication realms (staff, customer, platform admin), allowing users to securely regain access without administrator intervention.

## ADDED Requirements

### Requirement: Staff member can request a password reset
The system SHALL allow a staff member to request a password reset by submitting their email address. If the email belongs to a staff user in the resolved tenant, the system SHALL generate a single-use reset token, send it via email, and return a success response. If the email does not exist, the system SHALL return the same success response to prevent email enumeration.

#### Scenario: Staff member requests reset for existing email
- **WHEN** a staff member submits their email to the forgot-password endpoint
- **THEN** the system generates a reset token, sends a password reset email, and returns 200

#### Scenario: Staff member requests reset for non-existent email
- **WHEN** a staff member submits an email that does not exist in the tenant
- **THEN** the system returns 200 with the same response shape (no email sent)

#### Scenario: Staff member requests reset without tenant context
- **WHEN** a forgot-password request arrives without a resolvable tenant
- **THEN** the system returns 400

### Requirement: Customer can request a password reset
The system SHALL allow a storefront customer to request a password reset by submitting their email address. If the email belongs to a customer in the resolved tenant, the system SHALL generate a single-use reset token, send it via email, and return a success response. If the email does not exist, the system SHALL return the same success response.

#### Scenario: Customer requests reset for existing email
- **WHEN** a customer submits their email to the storefront forgot-password endpoint
- **THEN** the system generates a reset token, sends a password reset email, and returns 200

#### Scenario: Customer requests reset for non-existent email
- **WHEN** a customer submits an email that does not exist in the tenant
- **THEN** the system returns 200 with the same response shape (no email sent)

### Requirement: Platform admin can request a password reset
The system SHALL allow a platform admin to request a password reset by submitting their email address. If the email belongs to a platform admin, the system SHALL generate a single-use reset token, send it via email, and return a success response. If the email does not exist, the system SHALL return the same success response.

#### Scenario: Platform admin requests reset for existing email
- **WHEN** a platform admin submits their email to the platform forgot-password endpoint
- **THEN** the system generates a reset token, sends a password reset email, and returns 200

#### Scenario: Platform admin requests reset for non-existent email
- **WHEN** a platform admin submits an email that does not exist
- **THEN** the system returns 200 with the same response shape (no email sent)

### Requirement: Reset token expires after a defined TTL
The system SHALL invalidate password reset tokens after a configurable time-to-live (default: 15 minutes). Expired tokens MUST NOT be accepted for password reset.

#### Scenario: Reset token used after expiry
- **WHEN** a user attempts to reset their password with a token that has expired
- **THEN** the system returns 400 and the token is rejected

#### Scenario: Reset token used within TTL
- **WHEN** a user attempts to reset their password with a valid, unexpired token
- **THEN** the system accepts the token and allows the password to be changed

### Requirement: Reset token is single-use
The system SHALL invalidate a password reset token immediately after it is used to successfully reset a password. The same token MUST NOT be reused.

#### Scenario: Reusing an already-consumed reset token
- **WHEN** a user attempts to reset their password with a token that has already been used
- **THEN** the system returns 400 and rejects the request

### Requirement: Staff member can reset password with valid token
The system SHALL allow a staff member to set a new password by providing a valid reset token and a new password. On success, the system SHALL update the password, invalidate the token, and revoke all existing refresh tokens for that user.

#### Scenario: Staff member resets password successfully
- **WHEN** a staff member submits a valid token and a new password meeting complexity requirements
- **THEN** the password is updated, the token is invalidated, all refresh tokens are revoked, and 200 is returned

#### Scenario: Staff member resets password with weak password
- **WHEN** a staff member submits a valid token but a password that does not meet complexity requirements
- **THEN** the system returns 400 and the password is unchanged

### Requirement: Customer can reset password with valid token
The system SHALL allow a customer to set a new password by providing a valid reset token and a new password. On success, the system SHALL update the password, invalidate the token, and revoke all existing refresh tokens for that customer.

#### Scenario: Customer resets password successfully
- **WHEN** a customer submits a valid token and a new password meeting complexity requirements
- **THEN** the password is updated, the token is invalidated, all refresh tokens are revoked, and 200 is returned

### Requirement: Platform admin can reset password with valid token
The system SHALL allow a platform admin to set a new password by providing a valid reset token and a new password. On success, the system SHALL update the password and invalidate the token.

#### Scenario: Platform admin resets password successfully
- **WHEN** a platform admin submits a valid token and a new password meeting complexity requirements
- **THEN** the password is updated, the token is invalidated, and 200 is returned

### Requirement: Reset token is cryptographically secure
The system SHALL generate password reset tokens using a cryptographically secure random source (minimum 32 bytes). Tokens SHALL be stored as SHA-256 hashes in the database, never in plaintext.

#### Scenario: Token storage is hashed
- **WHEN** a password reset token is generated and stored
- **THEN** only the SHA-256 hash of the token is persisted to the database

### Requirement: Password reset email contains a time-limited link
The system SHALL send a password reset email containing a link with the reset token as a URL parameter. The link SHALL point to the appropriate reset-password page for the realm (staff, customer, or platform).

#### Scenario: Staff reset email links to admin reset page
- **WHEN** a staff member requests a password reset
- **THEN** the email contains a link to the admin reset-password page with the token

#### Scenario: Customer reset email links to storefront reset page
- **WHEN** a customer requests a password reset
- **THEN** the email contains a link to the storefront reset-password page with the token

#### Scenario: Platform reset email links to platform reset page
- **WHEN** a platform admin requests a password reset
- **THEN** the email contains a link to the platform reset-password page with the token

### Requirement: Forgot-password requests are rate-limited
The system SHALL rate-limit forgot-password requests per email address to prevent abuse (default: 1 request per 60 seconds per email per tenant).

#### Scenario: Rapid successive forgot-password requests
- **WHEN** a user submits multiple forgot-password requests for the same email within 60 seconds
- **THEN** the system returns 429 for subsequent requests
