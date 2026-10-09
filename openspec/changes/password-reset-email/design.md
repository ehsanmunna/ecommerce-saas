## Context

The system has three independent auth realms (staff, customer, platform admin) each with separate JWT secrets, refresh token tables, and login pages. The `MailService` already supports SMTP with a dev fallback (logs the link). Refresh tokens are stored as SHA-256 hashes. The storefront forgot-password page is a stub. No password reset infrastructure exists anywhere.

## Goals / Non-Goals

**Goals:**
- Implement a complete password reset flow for all three realms using the existing mail infrastructure
- Store reset tokens as SHA-256 hashes (same pattern as refresh tokens)
- Single-use tokens with a 15-minute TTL
- Rate-limit forgot-password requests to prevent abuse
- Revoke all refresh tokens on successful password reset (forces re-login on all devices)

**Non-Goals:**
- Magic link / passwordless login (separate feature)
- Password complexity policy changes (reuse existing validation)
- Email template customization UI
- SMS-based reset

## Decisions

### Decision 1: Separate `PasswordResetToken` model per schema

Staff and platform admin reset tokens go in the **platform** Prisma schema (they share the platform-level database). Customer reset tokens go in the **tenant** Prisma schema (each tenant has its own database).

**Rationale:** Matches the existing architecture — staff users and platform admins live in the platform DB, customers live in tenant DBs. Keeping tokens co-located with their user records avoids cross-database joins.

**Alternative:** A single reset token table in the platform DB with a `realm` discriminator. Rejected because customer resets would require a cross-DB write on every forgot-password request, adding latency and failure modes.

### Decision 2: Token generation — 32-byte random, SHA-256 hashed storage

Use `crypto.randomBytes(32).toString('hex')` for the token, store `sha256(token)` in the DB. The raw token is only sent in the email.

**Rationale:** Same pattern as refresh tokens. 32 bytes = 256 bits of entropy, sufficient to prevent brute-force. Hashing at rest means a DB leak doesn't expose usable tokens.

### Decision 3: Token TTL — 15 minutes

Reset tokens expire after 15 minutes (configurable via `PASSWORD_RESET_TOKEN_TTL_MINUTES` env var).

**Rationale:** Short enough to limit the window for token misuse, long enough for the email to be delivered and clicked. Industry standard (GitHub, Google, etc. use 15–60 minutes).

### Decision 4: Rate limiting — 1 request per 60 seconds per email per tenant

Track the last forgot-password request timestamp per email in the `PasswordResetToken` table (the `createdAt` of the most recent token). If a new request comes in within 60 seconds, return 429.

**Rationale:** Prevents email bombing and enumeration attacks. Using the existing token table avoids adding a separate rate-limiting store.

**Alternative:** In-memory rate limiter. Rejected because it doesn't survive restarts and doesn't work across multiple API instances.

### Decision 5: Revoke all refresh tokens on successful password reset

When a password reset succeeds, delete all `RefreshToken` records for that user. This forces all existing sessions to re-authenticate.

**Rationale:** If a user forgot their password, it's possible an attacker triggered the reset. Revoking all sessions ensures any attacker's session is also invalidated.

### Decision 6: Same response for existing and non-existing emails

Both return `200 { message: 'If an account exists, a reset email has been sent' }`. This prevents email enumeration.

**Rationale:** Standard security practice. An attacker can't use the forgot-password endpoint to discover which emails have accounts.

### Decision 7: Reset link format

- Staff: `https://<admin-domain>/reset-password?token=<token>&slug=<tenant-slug>`
- Customer: `https://<storefront-domain>/reset-password?token=<token>`
- Platform: `https://<admin-domain>/platform/reset-password?token=<token>`

The reset-password page reads the token from the URL query param and submits it to the reset endpoint.

## Risks / Trade-offs

- **[Risk]** Email delivery delay causes token to expire before user clicks → Mitigation: 15-minute TTL is generous; can be increased via env var
- **[Risk]** User requests reset, then remembers password and logs in normally → No issue: the token is simply never used and expires
- **[Risk]** Attacker with access to user's email can trigger resets repeatedly → Mitigation: rate limiting + the attacker still needs to click the link in the email
- **[Trade-off]** Revoking all refresh tokens on reset is slightly inconvenient for the user (must log in again on all devices) but is the safer choice
- **[Risk]** Token in URL may be logged in browser history or server logs → Mitigation: single-use + short TTL limits exposure; recommend HTTPS

## Migration Plan

1. Add `PasswordResetToken` model to platform schema and tenant schema
2. Run `prisma migrate dev` for both schemas to create the tables
3. Deploy API changes (new endpoints + mail template)
4. Deploy frontend changes (new pages + wire login links)
5. No backward compatibility concerns — purely additive

**Rollback:** Remove the new endpoints and pages. The `PasswordResetToken` table can remain (unused) or be dropped via a follow-up migration.
