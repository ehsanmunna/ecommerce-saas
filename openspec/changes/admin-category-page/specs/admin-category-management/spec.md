## Purpose

Gives tenant staff a dedicated place in the admin dashboard to view and create the categories their products are organized into.

## ADDED Requirements

### Requirement: Categories page
The system SHALL render a categories page at `/dashboard/categories` listing the tenant's categories with their product counts, plus a form to create a new category (name and slug).

#### Scenario: Page lists categories
- **WHEN** an authenticated staff user opens `/dashboard/categories`
- **THEN** the page shows all of the tenant's categories with product counts

#### Scenario: Create category from the page
- **WHEN** the staff user submits the create-category form with valid name and slug
- **THEN** the category is created via the admin API and appears in the list

#### Scenario: Unauthenticated access redirected
- **WHEN** an unauthenticated user navigates to `/dashboard/categories`
- **THEN** they are redirected to login

### Requirement: Categories navigation entry
The system SHALL include a "Categories" link in the dashboard sidebar navigation pointing at `/dashboard/categories`.

#### Scenario: Navigate to categories
- **WHEN** a staff user clicks "Categories" in the sidebar
- **THEN** the categories page is shown
