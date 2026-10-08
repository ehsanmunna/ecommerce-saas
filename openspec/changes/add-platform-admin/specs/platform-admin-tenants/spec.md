## Purpose

Give platform administrators operational control over tenants: list, create, activate/suspend, and repair verification/provisioning state through a dedicated admin UI and API.

## ADDED Requirements

### Requirement: List tenants
The platform admin SHALL be able to list all tenants with id, name, slug, status, plan, created date, and verification state, with filtering by status.

#### Scenario: List all tenants
- **WHEN** a platform admin requests the tenant list
- **THEN** the system returns every tenant with its status and plan

#### Scenario: Filter by status
- **WHEN** a platform admin requests tenants filtered by status `PROVISIONING_FAILED`
- **THEN** only tenants in that status are returned

### Requirement: Create tenant directly
The platform admin SHALL be able to create a tenant with company name, slug, owner email, and plan — no owner password is set at creation. The system SHALL send an invite email to the owner containing a single-use setup link, and the tenant SHALL sit in `PENDING_OWNER_SETUP` until the owner sets their password, at which point provisioning starts.

#### Scenario: Platform-created tenant sends invite and waits
- **WHEN** a platform admin submits a valid tenant payload
- **THEN** the tenant is created in `PENDING_OWNER_SETUP`, an invite email is sent to the owner, and no database is provisioned yet

#### Scenario: Owner accepts invite
- **WHEN** the owner opens the invite link and sets a password
- **THEN** the password is hashed, the invite token is consumed, and provisioning starts synchronously

#### Scenario: Invite token reused after success
- **WHEN** an invite token that has already been consumed is submitted
- **THEN** the system responds 400 and the tenant state is unchanged

#### Scenario: Duplicate slug rejected
- **WHEN** a slug that already exists is submitted
- **THEN** the system responds 409 and no tenant is created

### Requirement: Activate and deactivate tenant
The platform admin SHALL be able to set a tenant's status to `ACTIVE` or `SUSPENDED`, and SHALL NOT be able to reactivate a tenant whose database/schema is missing.

#### Scenario: Suspend a tenant
- **WHEN** a platform admin suspends an ACTIVE tenant
- **THEN** the tenant status becomes `SUSPENDED` and tenant API access is blocked

#### Scenario: Reactivate a suspended tenant
- **WHEN** a platform admin reactivates a SUSPENDED tenant whose database exists
- **THEN** the tenant status returns to `ACTIVE`

#### Scenario: Reactivate tenant without database rejected
- **WHEN** a platform admin tries to set ACTIVE on a tenant whose database does not exist
- **THEN** the system responds 409 and the status is unchanged

### Requirement: Suspended tenant access blocked
While a tenant is `SUSPENDED`, tenant users SHALL be denied access to their tenant APIs.

#### Scenario: Suspended tenant request
- **WHEN** a tenant user makes an API request while their tenant is SUSPENDED
- **THEN** the system responds 403 with a tenant-suspended error

### Requirement: Verification and provisioning repair
The platform admin SHALL be able to view a tenant's verification/provisioning timestamps, resend a verification email, revoke the current verification token (making it immediately invalid), and retry failed provisioning.

#### Scenario: Resend verification
- **WHEN** a platform admin requests resend for a `PENDING_VERIFICATION` tenant
- **THEN** a new verification email is sent and the old token hash is replaced

#### Scenario: Revoke verification token
- **WHEN** a platform admin revokes a tenant's verification token
- **THEN** the stored token hash is cleared and the previous link no longer verifies

#### Scenario: Retry failed provisioning
- **WHEN** a platform admin retries provisioning for a `PROVISIONING_FAILED` tenant
- **THEN** partial resources are cleaned up and provisioning restarts

### Requirement: Plan management
The platform admin SHALL be able to view and update a tenant's plan, and the plan chosen at public signup SHALL persist on the tenant record.

#### Scenario: Signup plan persists
- **WHEN** a tenant signs up selecting plan `PRO`
- **THEN** the tenant record stores plan `PRO`

#### Scenario: Platform admin changes plan
- **WHEN** a platform admin updates a tenant's plan
- **THEN** the tenant record reflects the new plan
