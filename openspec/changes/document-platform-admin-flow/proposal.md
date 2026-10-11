## Why

`user-flow.md` documents the tenant signup-to-checkout pipeline but says
nothing about the platform-admin side of the system that
`add-platform-admin` introduced. Platform operators currently have no
runnable walkthrough for logging into the platform area, listing/creating
tenants, suspending/activating them, or repairing verification/provisioning
state — the only reference is the change proposal and design docs, which
are not task-oriented. A platform-admin section closes that gap and keeps
the doc honest as the platform area evolves.

## What Changes

- Add a platform-admin section to `user-flow.md` covering:
  - Platform admin login (separate from tenant staff login) at
    `http://localhost:3000/platform/login`, authenticating via
    `POST /platform/auth/login` to get a `type: 'platform'` JWT.
  - Browsing the tenant list with status/plan filters and opening a tenant
    detail page.
  - Creating a tenant (company name, slug, owner email, plan) which sends
    an invite email and leaves the tenant in `PENDING_OWNER_SETUP` until
    the owner accepts the invite at the public accept-invite page.
  - Status actions: suspend, activate, reactivate — including the 403 a
    suspended tenant's staff/storefront requests now get.
  - Repair actions: resend verification, revoke verification token, retry
    failed provisioning, and invite resend/revoke.
  - Editing a tenant's plan.
- Update the "Known gaps" section of `user-flow.md` where it referenced
  the removed unauthenticated repair endpoints, and note that the catalog
  seeding gap (no admin Products UI) is unchanged.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — documentation-only change with no change in system behavior.
`.openspec.yaml` sets `skip_specs: true`.

## Impact

- `user-flow.md`: new platform-admin section plus minor edits to the
  known-gaps list.
- No code, API, schema, or dependency changes.
