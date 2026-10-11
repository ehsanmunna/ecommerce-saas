## MODIFIED Requirements

### Requirement: Activate and deactivate tenant
The platform admin SHALL be able to set a tenant's status to `ACTIVE`, `SUSPENDED`, or `EXPIRED`, and SHALL NOT be able to reactivate a tenant whose database/schema is missing. Setting a status of `DELETED` through the status endpoint SHALL be rejected; deletion uses the dedicated delete endpoint.

#### Scenario: Suspend a tenant
- **WHEN** a platform admin suspends an ACTIVE tenant
- **THEN** the tenant status becomes `SUSPENDED` and tenant API access is blocked

#### Scenario: Reactivate a suspended tenant
- **WHEN** a platform admin reactivates a SUSPENDED tenant whose database exists
- **THEN** the tenant status returns to `ACTIVE`

#### Scenario: Reactivate tenant without database rejected
- **WHEN** a platform admin tries to set ACTIVE on a tenant whose database does not exist
- **THEN** the system responds 409 and the status is unchanged

#### Scenario: Expire a tenant
- **WHEN** a platform admin sets a tenant's status to `EXPIRED`
- **THEN** the tenant status becomes `EXPIRED` and tenant API access is blocked

#### Scenario: Delete via status endpoint rejected
- **WHEN** a platform admin submits `DELETED` to the status endpoint
- **THEN** the system responds 400 and the status is unchanged

### Requirement: Suspended tenant access blocked
While a tenant is `SUSPENDED`, `EXPIRED`, or `DELETED`, tenant users SHALL be denied access to their tenant APIs.

#### Scenario: Suspended tenant request
- **WHEN** a tenant user makes an API request while their tenant is SUSPENDED
- **THEN** the system responds 403 with a tenant-suspended error

#### Scenario: Expired tenant request
- **WHEN** a tenant user makes an API request while their tenant is EXPIRED
- **THEN** the system responds 403 with a tenant-unavailable error

#### Scenario: Deleted tenant request
- **WHEN** a tenant user makes an API request while their tenant is DELETED
- **THEN** the system responds 403 with a tenant-unavailable error

### Requirement: List tenants
The platform admin SHALL be able to list all tenants with id, name, slug, status, plan, created date, and verification state, with filtering by status. Tenants with status `DELETED` SHALL be excluded from unfiltered list results, but SHALL be returned when the caller explicitly filters by `DELETED`.

#### Scenario: List all tenants
- **WHEN** a platform admin requests the tenant list
- **THEN** the system returns every non-DELETED tenant with its status and plan

#### Scenario: Filter by status
- **WHEN** a platform admin requests tenants filtered by status `PROVISIONING_FAILED`
- **THEN** only tenants in that status are returned

#### Scenario: Filter by DELETED
- **WHEN** a platform admin requests tenants filtered by status `DELETED`
- **THEN** only deleted tenants are returned

## ADDED Requirements

### Requirement: Delete tenant (soft-delete)
The platform admin SHALL be able to delete a tenant. Deletion SHALL set the tenant's status to `DELETED`, preserve the tenant record and its database/schema, and block all tenant access.

#### Scenario: Delete a tenant
- **WHEN** a platform admin deletes an existing tenant
- **THEN** the tenant status becomes `DELETED`, the tenant's database and record are preserved, and subsequent tenant requests are rejected

#### Scenario: Delete an already deleted tenant
- **WHEN** a platform admin deletes a tenant whose status is already `DELETED`
- **THEN** the system responds 409 and no change is made

#### Scenario: Delete unknown tenant
- **WHEN** a platform admin deletes a tenant id that does not exist
- **THEN** the system responds 404

### Requirement: Tenant list row actions
The platform tenants list SHALL expose, per row, an action to change the tenant's status to `ACTIVE`, `SUSPENDED`, or `EXPIRED`, and an action to delete the tenant, where delete requires a confirmation before the request is sent.

#### Scenario: Change status from the list
- **WHEN** a platform admin selects `SUSPENDED` for a row in the tenants list
- **THEN** the tenant's status updates in the API and the row reflects the new status

#### Scenario: Delete requires confirmation
- **WHEN** a platform admin clicks delete on a row and cancels the confirmation
- **THEN** no delete request is sent and the tenant is unchanged

#### Scenario: Confirmed delete removes row from default list
- **WHEN** a platform admin confirms delete on a row
- **THEN** the tenant is soft-deleted and no longer appears in the default (unfiltered) list
