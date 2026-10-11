## Context

See proposal.md - Why. Current state: `apps/api/src/modules/mail/mail.service.ts` builds the nodemailer transporter once in its constructor with `secure: process.env.SMTP_SECURE === 'true'` and no timeouts; `sendTenantVerification` lets `transporter.sendMail` errors propagate. `tenant-registration.service.ts` wraps the send in try/catch only in `register()` (→ 400 `BadRequestException`); `resendVerification()` has no handling, so nodemailer errors escape as unhandled 500s. The observed incident used `SMTP_PORT=465` with `SMTP_SECURE='ssl'`, producing `secure: false` against an implicit-TLS port.

## Goals / Non-Goals

**Goals:**
- Correct transport construction for mainstream SMTP setups (Gmail 465/587, Mailtrap, SES) without requiring exact `SMTP_SECURE=true` spelling.
- Bounded send latency via explicit timeouts.
- One classification + mapping path for mail-send failures used by both register and resend.
- Early operator visibility into SMTP misconfiguration at startup.

**Non-Goals:**
- Changing the verify-first flow, token handling, or the fail-open design (tenant stays `PENDING_VERIFICATION` on send failure).
- Retry/queueing of failed emails (a resend endpoint already exists for recovery).
- Switching mail providers/libraries or adding template rendering.

## Decisions

- **Secure-flag parsing helper + port-465 inference in `MailService`.** Parse `SMTP_SECURE` case-insensitively against `true/1/yes/ssl`; then `secure = parsed || port === 465`. Rationale: port 465 is unambiguous (implicit TLS per RFC 8314), so inferring is always safe and fixes the reported misconfig even if the flag is wrong. Alternative considered: validating config at startup and refusing to boot — rejected as too hostile for dev (log-only mode is a feature) and for existing deployments.
- **Explicit timeouts on the transporter**: `connectionTimeout`, `greetingTimeout`, `socketTimeout` at 10s (env-overridable later if needed; fixed constant now). Rationale: nodemailer's defaults (no connection timeout, 30s greeting, 10min socket) are why failures feel like hangs. 10s is generous for SMTP over the public internet and keeps request latency bounded.
- **Classify failures with a `MailSendError`** carrying `category: 'connection' | 'auth' | 'other'`. Classification from nodemailer error shape: `EAUTH` or `responseCode` 535 → `auth`; `ESOCKET`/`ETIMEDOUT`/`ECONNREFUSED`/`ECONNECTION` → `connection`; everything else → `other`. `MailService.sendTenantVerification` catches nodemailer errors, logs the full detail server-side, and rethrows the classified error. Rationale: keeps transport knowledge inside the mail module; HTTP mapping stays in the registration service.
- **Map to 502 `BadGatewayException` in `TenantRegistrationService`, shared by register and resend.** A small private helper wraps the send: catch `MailSendError` → 502 with message per category ("Verification email could not be sent: cannot connect to mail server" / "mail server authentication failed" / "mail send failed"); rethrow non-mail errors untouched. Rationale: mail is an upstream dependency so 502 is semantically right; the user explicitly asked failures be reported as connection-related errors with clear messages. This changes register's mail-failure status from 400 → 502 (accepted in proposal; resend changes from unhandled 500 → 502).
- **Startup verification via `OnModuleInit` calling `transporter.verify()`** when configured; failures logged as warnings with the category, never thrown. Rationale: surfaces auth/connection problems at boot without breaking log-only dev mode or blocking startup on a transient outage.

## Risks / Trade-offs

- [Register's mail-failure status changes 400 → 502 — a client that branches on 400 could behave differently] → Admin signup UI treats these as generic failures today; the 502 body still carries a readable message. Noted in proposal as the only behavior change.
- [Port-465 inference could surprise someone intentionally running plaintext on 465] → Effectively nonexistent in practice; documented in design and `.env.example`.
- [Startup `verify()` adds a network call at boot] → Fire-and-log with timeout; failure never blocks startup.
- [Classification heuristics may mislabel exotic provider errors as `other`] → Safe generic message; server-side log keeps the full nodemailer error for diagnosis.

## Migration Plan

No data migration. Deploy = restart API with new code. Operators on port 465 can remove `SMTP_SECURE` entirely or set it to `true`; existing correct configs (`587` + `SMTP_SECURE=false`, or `465` + `SMTP_SECURE=true`) behave identically. Rollback = revert the two source files; no state to unwind.
