## MODIFIED Requirements

### Requirement: Categories page
The system SHALL render a categories page at `/dashboard/categories` listing the tenant's categories with their product counts, with controls to navigate to create/edit pages.

#### Scenario: Page lists categories
- **WHEN** an authenticated staff user opens `/dashboard/categories`
- **THEN** the page shows all of the tenant's categories with product counts

#### Scenario: Navigate to create category
- **WHEN** the staff user clicks "New category"
- **THEN** they are taken to `/dashboard/categories/new`

#### Scenario: Navigate to edit category
- **WHEN** the staff user clicks "Edit" on a row
- **THEN** they are taken to `/dashboard/categories/:id/edit`

#### Scenario: Unauthenticated access redirected
- **WHEN** an unauthenticated user navigates to `/dashboard/categories`
- **THEN** they are redirected to login

### Requirement: Categories navigation entry
The system SHALL include a "Categories" link in the dashboard sidebar navigation pointing at `/dashboard/categories`.

#### Scenario: Navigate to categories
- **WHEN** a staff user clicks "Categories" in the sidebar
- **THEN** the categories page is shown

## ADDED Requirements

### Requirement: Category create and edit pages
The system SHALL let staff create a category from `/dashboard/categories/new` and edit a category's name/slug from `/dashboard/categories/:id/edit`. After a successful save, the user SHALL be returned to `/dashboard/categories`.

#### Scenario: Create category from the page
- **WHEN** the staff user submits the create-category form with valid name and slug
- **THEN** the category is created via the admin API and the user is redirected to `/dashboard/categories`

#### Scenario: Edit category from the page
- **WHEN** the staff user submits updates on the edit page
- **THEN** the category is updated via the admin API and the user is redirected to `/dashboard/categories`
