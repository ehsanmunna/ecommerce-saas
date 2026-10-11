## Why

Password fields across the admin app are masked with no way to reveal them, forcing users to retype when they make a typo and making typos silent. Add a show/hide toggle to every password input.

## What Changes

- Every password input in the admin app (`/login`, `/signup`, `/platform/login`, `/platform/new`) gains an eye-icon toggle button that flips the input between `type="password"` and `type="text"`.
- The toggle is a reusable component; signup and platform login/signup get the same treatment as `/login`.

## Capabilities

### New Capabilities
- `auth-web`: shared behavior for authentication-facing pages in the admin app, including password visibility toggling.

### Modified Capabilities
<!-- none -->

## Impact

- `apps/admin/app`: new `PasswordInput` component (or inline toggle per page) and wiring into the four pages listed above.
- No API, schema, or backend changes. No new dependencies (inline SVG eye icon).
