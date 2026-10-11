## Why

`POST /auth/forgot-password` returns a 500 Internal Server Error because the `password_reset_tokens` table does not exist in the platform database. The `AuthService.forgotPassword` method queries `this.platformPrisma.passwordResetToken`, but the platform schema migration was never run, so the table is missing and Prisma throws an unhandled exception.

## What Changes

- Add a Prisma migration for the platform schema to create the `password_reset_tokens` table
- Add error handling to the forgot-password endpoint so database errors return a proper 500 with a meaningful message instead of an unhandled exception
- Add a startup check that verifies the platform database has the required tables

## Capabilities

### New Capabilities
<!-- No new capabilities — this is a bug fix -->

### Modified Capabilities
<!-- No spec-level behavior changes — bug fix only -->

## Impact

- `prisma/platform/migrations/` — new migration file
- `apps/api/src/modules/auth/auth.service.ts` — error handling
- `apps/api/src/database/platform/platform-prisma.service.ts` — startup table check
