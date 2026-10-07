## 1. MailService transport hardening

- [x] 1.1 In `apps/api/src/modules/mail/mail.service.ts`, add a private helper to parse `SMTP_SECURE` case-insensitively against `true/1/yes/ssl`, and compute `secure = parsed || port === 465` when building the transporter
- [x] 1.2 Add explicit `connectionTimeout`, `greetingTimeout`, and `socketTimeout` (10s constants) to the transporter options
- [x] 1.3 Implement `OnModuleInit` in `MailService`: when a transporter exists, call `transporter.verify()` and log a clear warning (with category) on failure; never throw

## 2. Failure classification

- [x] 2.1 Add a `MailSendError` (extends `Error`) carrying `category: 'connection' | 'auth' | 'other'`, exported from the mail module
- [x] 2.2 In `sendTenantVerification`, wrap `transporter.sendMail` in try/catch: log the full nodemailer error server-side, classify it (`EAUTH`/535 → `auth`; `ESOCKET`/`ETIMEDOUT`/`ECONNREFUSED`/`ECONNECTION` → `connection`; else `other`), and rethrow as `MailSendError`

## 3. Consistent API error mapping

- [x] 3.1 In `apps/api/src/modules/tenant/tenant-registration.service.ts`, add a private helper that wraps `mail.sendTenantVerification`: catch `MailSendError` and throw `BadGatewayException` with a per-category safe message ("cannot connect to mail server" / "mail server authentication failed" / "mail send failed"); rethrow other errors untouched
- [x] 3.2 Use the helper in `register()` (replacing the existing 400 `BadRequestException` mail catch)
- [x] 3.3 Use the helper in `resendVerification()` (currently unhandled → 500)
- [x] 3.4 Update the `@ApiResponse` docs in `tenant.controller.ts` for register and resend endpoints to document 502 for mail-send failure

## 4. Config docs and local env

- [x] 4.1 Update `apps/api/.env.example` SMTP comments: `SMTP_SECURE=true` required/implied for port 465, accepted true values, and a Gmail app-password note
- [x] 4.2 Fix the local `apps/api/.env`: change `SMTP_SECURE='ssl'` to `SMTP_SECURE=true` (unblocks Gmail on 465 immediately)

## 5. Tests

- [x] 5.1 Unit test `MailService` transport config: `SMTP_SECURE` values (`true`/`1`/`yes`/`ssl`/unset) and port-465 inference produce the expected `secure` value
- [x] 5.2 Unit test failure classification in `sendTenantVerification`: mocked `sendMail` rejections map to `connection`/`auth`/`other` `MailSendError`s
- [x] 5.3 Service-level test: resend with a failing mail send responds 502 (not 500) with a safe message; register mail failure responds 502 and leaves the tenant `PENDING_VERIFICATION`
- [x] 5.4 Run `npm run test --workspace=apps/api`, `npm run lint --workspace=apps/api`, and the tenant-lifecycle e2e suite to confirm no regressions
