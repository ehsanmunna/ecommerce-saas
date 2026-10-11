## Why

Sending the tenant verification email fails at runtime with a generic `500 Internal Server Error`. Root cause: `MailService` only treats `SMTP_SECURE === 'true'` as secure, so a real-world config like `SMTP_PORT=465` with `SMTP_SECURE=ssl` silently creates a plaintext transporter against an implicit-TLS port and the send fails. The failure surfaces inconsistently: `register` maps it to a 400, while `resendVerification` lets the raw nodemailer error escape as a 500 with no useful message, and missing socket timeouts can hang the request for 30+ seconds.

## What Changes

- Harden SMTP configuration in `MailService`: accept `true/1/yes/ssl` for `SMTP_SECURE`, and infer `secure: true` when `SMTP_PORT=465` regardless of the flag; add explicit connection/greeting/socket timeouts (~10s) so failed sends return promptly.
- Add a startup SMTP sanity check (`transporter.verify()`) that logs a clear warning when the configured server is unreachable or credentials are rejected, instead of discovering it on the first signup.
- Classify mail-send failures (`connection`, `auth`, `other`) from nodemailer error codes and map them to a consistent, safe API error: `502 Bad Gateway` with a human-readable message (e.g. "cannot connect to mail server" vs "mail server authentication failed"), never leaking credentials or raw stack details. Applied uniformly to register and resend paths.
- Document the `SMTP_SECURE=true` requirement for port 465 and Gmail app-password usage in `apps/api/.env.example`.

Non-breaking: successful-send behavior, the verify-first flow, and the fail-open design (tenant stays `PENDING_VERIFICATION` on send failure so resend can recover) are unchanged. The register path's status code changes from 400 to 502 for mail-send failures only.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tenant-signup-verification`: adds requirements for SMTP configuration handling (secure-flag parsing, port-465 inference, timeouts, startup verification) and for consistent, classified mail-send failure responses (502 with safe message) on both register and resend.

## Impact

- Code: `apps/api/src/modules/mail/mail.service.ts`, `apps/api/src/modules/tenant/tenant-registration.service.ts`
- Config/docs: `apps/api/.env.example` (SMTP comments); no new env vars required
- APIs: `POST /tenants/register` and both resend endpoints return `502` (instead of 400/500) when the SMTP send fails; response body includes a safe, classified message
- Dependencies: none new (uses existing `nodemailer`)
- Tests: unit tests for secure-flag/port inference and failure classification; service-level test that resend failure returns 502
