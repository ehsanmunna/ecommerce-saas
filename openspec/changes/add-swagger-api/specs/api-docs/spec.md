## Purpose

Gives anyone integrating against the backend API (including future
maintainers) a single, always-current, browsable reference for every
endpoint, request/response shape, and the tenant-scoped request
conventions this system requires.

## ADDED Requirements

### Requirement: Interactive API documentation
The system SHALL serve human-browsable documentation describing every
public HTTP endpoint, including its request parameters/body shape,
possible responses, and authentication requirements.

#### Scenario: Browsing the documentation
- **WHEN** a developer opens the documentation endpoint in a browser
- **THEN** every endpoint exposed by the API (tenant registration, auth,
  `/me`, health) is listed with its request and response shapes

### Requirement: Machine-readable API description
The system SHALL also expose the same API description in a
machine-readable format (OpenAPI/JSON), so it can be consumed by tooling
(client generators, API testing tools) without scraping the human-facing
docs page.

#### Scenario: Fetching the machine-readable description
- **WHEN** a client requests the machine-readable API description endpoint
- **THEN** it receives a valid OpenAPI document describing the current API
  surface

### Requirement: Documentation reflects tenant-scoped request conventions
For any endpoint that requires tenant resolution or authentication, the
documentation SHALL make the required request elements (the tenant-slug
header used in non-production environments, and the bearer token scheme
for authenticated routes) explicit enough that a reader can successfully
exercise the endpoint from the documentation UI itself.

#### Scenario: Trying a tenant-scoped endpoint from the docs UI
- **WHEN** a developer uses the documentation UI's "try it out" feature on
  a tenant-scoped endpoint, supplying the documented tenant header and (for
  protected routes) a bearer token
- **THEN** the request succeeds exactly as it would via a direct HTTP call
  with the same headers

### Requirement: Documentation is not exposed in production by default
The system SHALL NOT serve the interactive or machine-readable API
documentation when running in a production environment, unless explicitly
enabled, so the full endpoint/schema map isn't handed to unauthenticated
visitors of a live deployment by default.

#### Scenario: Requesting docs in a production environment
- **WHEN** the API is running with a production environment configuration
  and documentation has not been explicitly re-enabled
- **THEN** requests to the documentation endpoints do not return the API
  documentation
