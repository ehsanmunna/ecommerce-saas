## Purpose

Shared client-side behavior for authentication-facing pages in the admin app.

## ADDED Requirements

### Requirement: Password inputs have a visibility toggle
Every password input in the admin app SHALL render an adjacent eye-icon button that switches the input between masked (`type="password"`) and visible (`type="text"`), and back, without clearing the typed value.

#### Scenario: Reveal the password
- **WHEN** the user clicks the eye toggle on a masked password field
- **THEN** the input switches to `type="text"` and the entered value is visible

#### Scenario: Mask the password again
- **WHEN** the user clicks the eye toggle on a visible password field
- **THEN** the input switches back to `type="password"` and the value is masked again

#### Scenario: Value preserved across toggles
- **WHEN** the user toggles visibility one or more times
- **THEN** the input value is unchanged

#### Scenario: Toggle is accessible
- **WHEN** the toggle button is focused or announced
- **THEN** it has an accessible label indicating its action (e.g. "Show password" / "Hide password")
