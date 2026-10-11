## Context

See proposal.md for motivation. The `password_reset_tokens` table is missing from the platform database because the platform schema migration was never run. The `AuthService.forgotPassword` method queries `this.platformPrisma.passwordResetToken`, which throws an unhandled exception when the table doesn't exist.

## Goals / Non-Goals

**Goals:**
- Ensure the `password_reset_tokens` table exists in the platform database at startup
- Return a meaningful error from the forgot-password endpoint when the database is unavailable
- Make platform schema migrations runnable via a npm script

**Non-Goals:**
- No changes to the password reset flow logic
- No changes to tenant database migrations

## Decisions

### 1. Startup migration for platform schema

Add an `onModuleInit` hook to `PlatformPrismaService` that runs `prisma migrate deploy` for the platform schema on startup. This ensures the `password_reset_tokens` table (and any future platform tables) exist before the API starts accepting requests.

- **Why:** The platform database is a single shared database (unlike tenant databases which are provisioned on-demand). Running migrations at startup is simpler than requiring a manual migration step.
- **Alternative:** A separate migration script run manually — rejected because it's error-prone and easy to forget.

### 2. Error handling in forgot-password

Wrap the `forgotPassword` method body in a try-catch that catches database errors and returns a 500 with a meaningful message instead of letting the exception propagate as an unhandled 500.

- **Why:** Even with migrations, transient database errors should return a proper error response, not an unhandled exception.

## Risks / Trade-offs

- [Startup migration adds a few seconds to boot time] → Acceptable for a single shared database
- [Migration failure prevents API startup] → This is intentional — fail fast rather than serve requests against a broken schema
