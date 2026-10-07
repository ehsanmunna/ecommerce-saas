## ADDED Requirements

### Requirement: SMTP configuration is interpreted robustly
The system SHALL interpret SMTP transport configuration so that common real-world settings produce a working connection: the secure-connection flag SHALL be treated as enabled for the values `true`, `1`, `yes`, and `ssl` (case-insensitive), and a secure (implicit TLS) connection SHALL be used automatically when the configured SMTP port is 465 regardless of the flag value. Sends SHALL be bounded by explicit connection, greeting, and socket timeouts so a misconfigured server cannot hang the request.

#### Scenario: Port 465 implies a secure connection
- **WHEN** SMTP is configured with port 465 and the secure flag is unset or set to a value other than a recognized true value
- **THEN** the system still establishes an implicit-TLS connection for sending mail

#### Scenario: Non-boolean secure flag values are honored
- **WHEN** the secure flag is set to `ssl`, `1`, or `yes` (any casing)
- **THEN** the system uses a secure connection for sending mail

#### Scenario: Unreachable server fails promptly
- **WHEN** the configured SMTP server is unreachable or drops the connection
- **THEN** the send fails within the configured timeout window (on the order of 10 seconds, not minutes) instead of hanging

### Requirement: SMTP misconfiguration is visible at startup
When SMTP is configured, the system SHALL verify the connection and credentials at application startup and log a clear warning if verification fails, so operators discover misconfiguration before the first signup. Startup verification failure SHALL NOT prevent the application from starting.

#### Scenario: Bad credentials logged at startup
- **WHEN** the application starts with an SMTP host configured and the server rejects the credentials
- **THEN** a warning is logged indicating SMTP authentication failed, and the application continues to run

#### Scenario: No SMTP configured stays in log-only mode
- **WHEN** no SMTP host is configured
- **THEN** verification emails are logged instead of sent and no startup verification is attempted

### Requirement: Mail send failures return a consistent classified error
When a verification email cannot be sent, both the register and resend endpoints SHALL respond with `502 Bad Gateway` and a safe, human-readable message that classifies the failure as a connection problem, an authentication problem, or a generic send failure. The response SHALL NOT include credentials, raw stack traces, or internal server details. A failed send SHALL leave the tenant in `PENDING_VERIFICATION` so the resend flow can recover.

#### Scenario: Connection failure on register
- **WHEN** a signup is submitted and the SMTP server cannot be reached or drops the connection
- **THEN** the system responds 502 with a message indicating the mail server could not be reached, and the tenant remains `PENDING_VERIFICATION`

#### Scenario: Authentication failure on resend
- **WHEN** a resend is requested and the SMTP server rejects the configured credentials
- **THEN** the system responds 502 with a message indicating mail server authentication failed, and the response contains no credentials or stack details

#### Scenario: No unhandled 500 from mail sending
- **WHEN** any mail-send failure occurs on the register or resend endpoints
- **THEN** the system never responds with an unclassified 500 Internal Server Error caused by the mail layer
