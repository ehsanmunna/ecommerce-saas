## Context

See proposal.md - Why. Four admin-app pages render bare `<input type="password">` fields: `app/login/page.tsx`, `app/signup/page.tsx`, `app/platform/login/page.tsx`, `app/platform/new/page.tsx`.

## Goals / Non-Goals

**Goals:**
- Eye-icon show/hide toggle on every password input.
- One reusable component so all four pages behave identically.

**Non-Goals:**
- Password strength meters, caps-lock warnings, or autofill changes.
- Toggling multiple fields with one control.

## Decisions

- **New `PasswordInput` component** (`apps/admin/app/components/password-input.tsx`) wrapping the input and an inline-SVG eye/eye-off button in a relative container, instead of duplicating toggle wiring per page. Alternative: a `useState` + button inline in each page — rejected because it duplicates state and markup four times.
- **No new dependency**: inline SVG (eye / eye-off) keeps scope to a few lines; adding `lucide-react` for one icon is unnecessary.
- **Toggle via input `type` swap**, standard accessible pattern; button `type="button"` so it never submits the form, with `aria-label` "Show password"/"Hide password" and `aria-pressed`.

## Risks / Trade-offs

- [Risk] Layout shift as the button occupies space → Mitigation: absolutely position the icon inside the input wrapper, add right padding to the input.
- [Risk] Button steals focus from submit flow → Mitigation: `type="button"` and it only toggles visibility.
