## Why

Users who forget their passwords currently have no self-service recovery path. The storefront forgot-password page is a stub, and no password reset endpoints exist for any auth realm (staff, customer, or platform admin). The mail infrastructure already exists and handles tenant verification emails, so we can extend it to support password reset tokens with minimal new infrastructure.

## What Changes

- Add a `PasswordResetToken` model to the platform Prisma schema (for staff and platform admin resets) and to the tenant Prisma schema (for customer resets)
- Add `POST /auth/forgot-password`, `POST /auth/reset-password` endpoints to the staff auth controller
- Add `POST /storefront/auth/forgot-password`, `POST /storefront/auth/reset-password` endpoints to the customer auth controller
- Add `POST /platform/auth/forgot-password`, `POST /platform/auth/reset-password` endpoints to the platform auth controller
- Extend `MailService` with `sendPasswordReset()` using the existing nodemailer infrastructure
- Add forgot-password and reset-password pages to the storefront (replacing the stub)
- Add forgot-password and reset-password pages to the admin app (staff login)
- Add forgot-password and reset-password pages to the platform admin login
- Wire the "Forgot password?" link on all login pages to the new flow

## Capabilities

### New Capabilities
- `password-reset`: Self-service password reset via email for all three auth realms (staff, customer, platform admin), including token generation, email delivery, token validation, and password update

### Modified Capabilities
<!-- No existing capability requirements change; this is purely additive -->

## Impact

- **API**: `apps/api/src/modules/auth/`, `apps/api/src/modules/customers/`, `apps/api/src/modules/platform/`, `apps/api/src/modules/mail/`
- **Prisma**: Platform schema (new `PasswordResetToken` model), tenant schema (new `PasswordResetToken` model)
- **Admin frontend**: `apps/admin/app/login/`, new `apps/admin/app/forgot-password/`, `apps/admin/app/reset-password/`, `apps/admin/app/platform/login/`, new platform forgot/reset pages
- **Storefront**: `apps/storefront/app/login/`, replace `apps/storefront/app/forgot-password/` stub, new `apps/storefront/app/reset-password/`
- **Mail**: Extend `MailService` with password reset email template
- **Token storage**: Password reset tokens are SHA-256 hashed before storage (same pattern as refresh tokens)
