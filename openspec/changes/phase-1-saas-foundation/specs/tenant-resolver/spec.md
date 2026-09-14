## Purpose

Maps every incoming request to exactly one tenant and its isolated database
connection, using the request's own origin rather than trusting any
client-supplied tenant identifier.

## ADDED Requirements

### Requirement: Resolve tenant from request host
The system SHALL resolve the tenant for every incoming request from its
`Host` header (default `<slug>.yoursaas.com` subdomain pattern) and attach
that tenant's database connection to the request before any business logic
runs.

#### Scenario: Request to a known active tenant subdomain
- **WHEN** a request arrives with `Host: acme.yoursaas.com` and a tenant
  with slug `acme` exists and is `ACTIVE`
- **THEN** the request is bound to the `acme` tenant's database connection

#### Scenario: Request to an unregistered subdomain
- **WHEN** a request arrives with a `Host` header that does not match any
  registered tenant slug
- **THEN** the system rejects the request rather than falling back to any
  default tenant

#### Scenario: Request to a non-active tenant
- **WHEN** a request resolves to a tenant whose status is
  `PROVISIONING`, `PROVISIONING_FAILED`, or `SUSPENDED`
- **THEN** the system rejects the request with an appropriate error rather
  than routing it to that tenant's database

### Requirement: Client-supplied tenant identifiers are never trusted alone
The system SHALL NOT determine a request's tenant from a client-supplied
value (path parameter, body field, or arbitrary header) in isolation from
host resolution.

#### Scenario: Mismatched tenant identifier in request body
- **WHEN** a request's `Host` resolves to tenant A but the request body or
  path references tenant B
- **THEN** the system does not act on tenant B's data based on that
  reference alone

### Requirement: Tenant resolution gates all business logic
No tenant-scoped request handler in the system SHALL execute business logic
before tenant resolution has succeeded. Platform-level endpoints that by
definition run before any tenant exists or independently of one (tenant
registration, tenant status lookup) are exempt from this gate — they SHALL
NOT depend on host-based tenant resolution.

#### Scenario: Unresolvable tenant short-circuits a tenant-scoped request
- **WHEN** tenant resolution fails for any reason on a tenant-scoped route
  (e.g. login, dashboard)
- **THEN** the request is rejected before reaching authentication or any
  other downstream handler

#### Scenario: Registering a brand-new tenant does not require resolution
- **WHEN** a client calls the tenant registration endpoint for a company
  that has no tenant record yet
- **THEN** the request succeeds without any tenant having been resolved
  from the request's host
