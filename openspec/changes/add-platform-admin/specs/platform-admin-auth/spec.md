## Purpose

Authenticate platform administrators separately from tenant users and guard all platform-management APIs with a dedicated scope.

## ADDED Requirements

### Requirement: Platform admin accounts
The system SHALL support platform administrator accounts stored in the platform database, with hashed passwords and unique email.

#### Scenario: Create first admin account
- **WHEN** a platform administrator account is seeded or created with a unique email and password
- **THEN** the account is stored with a hashed password and is retrievable by email

### Requirement: Platform admin login
The system SHALL provide a login endpoint accepting email and password that returns a platform-scoped JWT on success.

#### Scenario: Successful login
- **WHEN** a valid platform-admin email and password are submitted
- **THEN** the system returns a JWT whose claims identify the admin and carry a platform scope

#### Scenario: Invalid credentials
- **WHEN** an unknown email or wrong password is submitted
- **THEN** the system rejects with 401 and no token is issued

### Requirement: Platform-scoped guard
The system SHALL protect every platform-management endpoint with a guard that requires a valid platform-scope JWT and SHALL reject tenant-user JWTs.

#### Scenario: Tenant JWT rejected on platform route
- **WHEN** a tenant user JWT is sent to a platform endpoint
- **THEN** the system responds 403

#### Scenario: Missing or invalid token
- **WHEN** no Authorization header or a malformed/expired token is sent to a platform endpoint
- **THEN** the system responds 401
