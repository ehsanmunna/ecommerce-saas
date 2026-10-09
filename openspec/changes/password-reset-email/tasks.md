## 1. Prisma schema — PasswordResetToken model

- [ ] 1.1 Add `PasswordResetToken` model to `prisma/platform/schema.prisma` (fields: id, tokenHash, userId, expiresAt, usedAt, createdAt; index on tokenHash)
- [ ] 1.2 Add `PasswordResetToken` model to `prisma/tenant/schema.prisma` (fields: id, tokenHash, customerId, expiresAt, usedAt, createdAt; index on tokenHash)
- [ ] 1.3 Run `prisma migrate dev` for platform schema to create the table
- [ ] 1.4 Run `prisma migrate dev` for tenant schema to create the table

## 2. Mail service — password reset email

- [ ] 2.1 Add `sendPasswordReset(email, resetLink)` method to `MailService`
- [ ] 2.2 Add password reset email template (HTML + plain text) with the reset link and expiry notice
- [ ] 2.3 Add unit test for `sendPasswordReset` in `mail.service.spec.ts`

## 3. Staff auth — forgot/reset password endpoints

- [ ] 3.1 Add `POST /auth/forgot-password` endpoint to `AuthController` — accepts `{ email }`, resolves tenant, finds user, generates token, sends email
- [ ] 3.2 Add `POST /auth/reset-password` endpoint to `AuthController` — accepts `{ token, newPassword }`, validates token, updates password, revokes refresh tokens
- [ ] 3.3 Add `forgotPassword` and `resetPassword` methods to `AuthService`
- [ ] 3.4 Add DTOs: `ForgotPasswordDto`, `ResetPasswordDto`
- [ ] 3.5 Add rate-limiting logic (60-second window per email per tenant)

## 4. Customer auth — forgot/reset password endpoints

- [ ] 4.1 Add `POST /storefront/auth/forgot-password` endpoint to `CustomerAuthController`
- [ ] 4.2 Add `POST /storefront/auth/reset-password` endpoint to `CustomerAuthController`
- [ ] 4.3 Add `forgotPassword` and `resetPassword` methods to `CustomerAuthService`
- [ ] 4.4 Add DTOs: `CustomerForgotPasswordDto`, `CustomerResetPasswordDto`
- [ ] 4.5 Add rate-limiting logic (60-second window per email per tenant)

## 5. Platform auth — forgot/reset password endpoints

- [ ] 5.1 Add `POST /platform/auth/forgot-password` endpoint to `PlatformAuthController`
- [ ] 5.2 Add `POST /platform/auth/reset-password` endpoint to `PlatformAuthController`
- [ ] 5.3 Add `forgotPassword` and `resetPassword` methods to `PlatformAuthService`
- [ ] 5.4 Add DTOs: `PlatformForgotPasswordDto`, `PlatformResetPasswordDto`
- [ ] 5.5 Add rate-limiting logic (60-second window per email)

## 6. Storefront frontend — forgot/reset password pages

- [ ] 6.1 Replace the stub at `apps/storefront/app/forgot-password/page.tsx` with a working form (email input, submit to API)
- [ ] 6.2 Create `apps/storefront/app/reset-password/page.tsx` — reads token from URL, new password + confirm fields, submit to API
- [ ] 6.3 Add `forgotPasswordCustomer` and `resetPasswordCustomer` to storefront `api-client.ts`
- [ ] 6.4 Wire "Forgot password?" link on storefront login page to `/forgot-password`
- [ ] 6.5 Add success/error states and form validation

## 7. Admin frontend — staff forgot/reset password pages

- [ ] 7.1 Create `apps/admin/app/forgot-password/page.tsx` — email + tenant slug form
- [ ] 7.2 Create `apps/admin/app/reset-password/page.tsx` — reads token from URL, new password + confirm fields
- [ ] 7.3 Add `forgotPasswordStaff` and `resetPasswordStaff` to admin `api-client.ts`
- [ ] 7.4 Wire "Forgot password?" link on admin login page to `/forgot-password`
- [ ] 7.5 Add success/error states and form validation

## 8. Platform admin frontend — forgot/reset password pages

- [ ] 8.1 Create `apps/admin/app/platform/forgot-password/page.tsx` — email form
- [ ] 8.2 Create `apps/admin/app/platform/reset-password/page.tsx` — reads token from URL, new password + confirm fields
- [ ] 8.3 Add `forgotPasswordPlatform` and `resetPasswordPlatform` to `platform-api-client.ts`
- [ ] 8.4 Wire "Forgot password?" link on platform login page to `/platform/forgot-password`
- [ ] 8.5 Add success/error states and form validation

## 9. E2E tests

- [ ] 9.1 Add e2e test: staff forgot-password generates token and sends email
- [ ] 9.2 Add e2e test: staff reset-password with valid token succeeds
- [ ] 9.3 Add e2e test: staff reset-password with expired token returns 400
- [ ] 9.4 Add e2e test: staff reset-password with reused token returns 400
- [ ] 9.5 Add e2e test: customer forgot-password generates token and sends email
- [ ] 9.6 Add e2e test: customer reset-password with valid token succeeds
- [ ] 9.7 Add e2e test: platform admin forgot-password generates token and sends email
- [ ] 9.8 Add e2e test: platform admin reset-password with valid token succeeds
- [ ] 9.9 Add e2e test: forgot-password rate limiting returns 429

## 10. Verification

- [ ] 10.1 Run `npm run build --workspace=apps/api` and fix any errors
- [ ] 10.2 Run `npm run lint --workspace=apps/api` and fix any errors
- [ ] 10.3 Run `npm run test --workspace=apps/api` and fix any failures
- [ ] 10.4 Run `npm run test:e2e --workspace=apps/api` and fix any failures
- [ ] 10.5 Run `npm run lint --workspace=apps/admin` and fix any errors
- [ ] 10.6 Run `npm run lint --workspace=apps/storefront` and fix any errors
- [ ] 10.7 Manually verify full flow: forgot-password → email → reset-password → login with new password (all three realms)
