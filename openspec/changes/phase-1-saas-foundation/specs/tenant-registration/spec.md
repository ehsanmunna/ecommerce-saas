## Purpose

Lets a new company sign up for the SaaS platform, creating the
platform-level tenant record that provisioning, tenant resolution, and
authentication are all built on top of.

## ADDED Requirements

### Requirement: Register a new tenant
The system SHALL accept a tenant registration request containing company
name, desired slug, owner email, and chosen plan, validate it, and create a
tenant record before triggering provisioning.

#### Scenario: Successful registration
- **WHEN** a registration request is submitted with a unique, validly
  formatted slug and complete required fields
- **THEN** the system creates a tenant record with status `PROVISIONING`
  and triggers the tenant provisioning workflow for it

#### Scenario: Duplicate slug rejected
- **WHEN** a registration request uses a slug that already belongs to an
  existing tenant
- **THEN** the system rejects the request with a clear validation error and
  creates no tenant record

#### Scenario: Invalid slug format rejected
- **WHEN** a registration request uses a slug containing characters unsafe
  for a subdomain or database name (anything other than lowercase letters,
  digits, and hyphens)
- **THEN** the system rejects the request with a validation error

### Requirement: Tenant slug uniqueness and format
Every tenant SHALL have a globally unique slug, used to derive its default
subdomain and tenant database name, restricted to lowercase alphanumeric
characters and hyphens.

#### Scenario: Reserved slug rejected
- **WHEN** a registration request uses a slug reserved by the platform
  (e.g. `app`, `api`, `www`)
- **THEN** the system rejects the request with a validation error

### Requirement: Registration status is queryable
After registering, a caller SHALL be able to query the tenant's current
status (`PROVISIONING`, `ACTIVE`, or `PROVISIONING_FAILED`) without waiting
for provisioning to finish synchronously.

#### Scenario: Status check while provisioning is in progress
- **WHEN** a client queries tenant status shortly after registration, before
  provisioning has completed
- **THEN** the system returns status `PROVISIONING` rather than timing out
  or blocking the request
