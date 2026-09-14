## Purpose

Authenticates platform and tenant users with JWT access tokens and refresh
tokens, ensuring every authenticated action is scoped to the tenant the
request actually resolved to.

## ADDED Requirements

### Requirement: Login issues a tenant-scoped token pair
The system SHALL authenticate a user's credentials against the resolved
tenant and, on success, issue an access token (embedding user id, tenant
id, and role) and a refresh token.

#### Scenario: Valid credentials for a member of the resolved tenant
- **WHEN** a user submits valid credentials on a request that resolved to
  tenant A, and that user belongs to tenant A
- **THEN** the system issues an access token and refresh token scoped to
  tenant A

#### Scenario: Valid credentials for a user of a different tenant
- **WHEN** a user submits valid credentials on a request that resolved to
  tenant A, but that user belongs only to tenant B
- **THEN** the system rejects the login

### Requirement: Access token tenant cross-check
On every authenticated request, the system SHALL verify that the access
token's tenant id matches the tenant resolved from the request's host, and
reject the request otherwise.

#### Scenario: Token tenant does not match resolved tenant
- **WHEN** a request carries a valid, unexpired access token for tenant A,
  but the request's `Host` resolves to tenant B
- **THEN** the system rejects the request, regardless of token validity

### Requirement: Refresh token rotation and expiry
The system SHALL allow an expired access token to be renewed using a valid,
unexpired refresh token, and SHALL reject renewal with an expired or
revoked refresh token.

#### Scenario: Renewing with a valid refresh token
- **WHEN** a client presents an expired access token together with a valid,
  unexpired refresh token
- **THEN** the system issues a new access token without requiring the user
  to re-enter credentials

#### Scenario: Renewing with an expired or revoked refresh token
- **WHEN** a client presents a refresh token that is expired or has been
  revoked
- **THEN** the system rejects the renewal and requires the user to log in
  again
