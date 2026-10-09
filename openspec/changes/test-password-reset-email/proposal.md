## Why

The password-reset-email change has been implemented but lacks automated e2e test coverage. This change adds end-to-end tests to verify the full password reset flow across all three auth realms (staff, customer, platform admin), ensuring the feature works correctly before archiving.

## What Changes

- Add e2e tests for staff forgot-password → reset-password flow
- Add e2e tests for customer forgot-password → reset-password flow
- Add e2e tests for platform admin forgot-password → reset-password flow
- Add e2e tests for token expiry, token reuse, and rate limiting

## Capabilities

### New Capabilities
<!-- No new capabilities — tests verify existing password-reset behavior -->

### Modified Capabilities
<!-- No spec-level behavior changes — tests only -->

## Impact

- `apps/api/test/` — new e2e test files for password reset flows
- No production code changes
