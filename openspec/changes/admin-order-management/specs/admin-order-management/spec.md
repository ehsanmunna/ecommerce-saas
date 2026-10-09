## Purpose

Gives tenant staff visibility and control over the orders their store has received — listing and filtering them, inspecting full order details, advancing their status, and cancelling them — through both the admin API and the admin dashboard.

## ADDED Requirements

### Requirement: Staff order list
The system SHALL expose a staff-only endpoint that returns the tenant's orders newest-first with pagination, filtering by order status and payment status, and free-text search over recipient name and customer email.

#### Scenario: List orders with filters
- **WHEN** an OWNER/ADMIN staff member requests the order list filtered to status `PENDING` with a page size of 20
- **THEN** only the tenant's pending orders are returned for that page, together with a total count matching the filter

#### Scenario: Search orders by recipient
- **WHEN** a staff member searches the order list for a recipient or customer email fragment
- **THEN** only orders whose recipient name or customer email matches the fragment are returned

#### Scenario: Orders never leak across tenants
- **WHEN** a staff member authenticated against tenant A requests the order list
- **THEN** only orders belonging to tenant A appear, regardless of any order id or filter supplied

#### Scenario: Unauthenticated or non-staff caller rejected
- **WHEN** a request without a valid staff token, or with a `STAFF`-role token, hits the order list endpoint
- **THEN** the request is rejected (401/403) and no order data is returned

### Requirement: Staff order detail
The system SHALL expose a staff-only endpoint that returns one tenant order in full: status, payment status and method, delivery method, shipping address, totals (subtotal, shipping, total, coupon code), the ordering customer's name and email, and every item with its product name, variant attributes, quantity, and unit price.

#### Scenario: View an order
- **WHEN** an OWNER/ADMIN staff member requests a valid order id from their tenant
- **THEN** the complete order including its customer and item details is returned

#### Scenario: Unknown or foreign order id
- **WHEN** a staff member requests an order id that does not exist or belongs to another tenant
- **THEN** the request is rejected as not found (404)

### Requirement: Advance order status
Staff with OWNER/ADMIN role SHALL be able to move an order exactly one step forward through `PENDING → CONFIRMED → SHIPPED → DELIVERED`; skipping steps, moving backward, or repeating a status SHALL be rejected, and a cancelled order SHALL NOT accept any status transition.

#### Scenario: Confirm a pending order
- **WHEN** staff advance an order whose status is `PENDING` to `CONFIRMED`
- **THEN** the order's status becomes `CONFIRMED`

#### Scenario: Skipping or reversing a status is rejected
- **WHEN** staff attempt to advance a `PENDING` order directly to `SHIPPED`, or move a `SHIPPED` order back to `CONFIRMED`
- **THEN** the transition is rejected and the order's status is unchanged

#### Scenario: Changing a cancelled order is rejected
- **WHEN** staff attempt any status transition on a `CANCELLED` order
- **THEN** the transition is rejected and the order remains `CANCELLED`

### Requirement: Staff order cancellation
Staff with OWNER/ADMIN role SHALL be able to cancel an order that has not shipped (`PENDING` or `CONFIRMED`); cancellation SHALL restore the order's inventory and SHALL be rejected once the order is `SHIPPED`, `DELIVERED`, or already `CANCELLED`.

#### Scenario: Cancel a confirmed order
- **WHEN** staff cancel an order whose status is `CONFIRMED`
- **THEN** the order's status becomes `CANCELLED` and the stock for each of its items is restored

#### Scenario: Cancelling a shipped order is rejected
- **WHEN** staff attempt to cancel an order whose status is `SHIPPED` or `DELIVERED`
- **THEN** the cancellation is rejected, the status is unchanged, and no inventory is restored

### Requirement: Admin orders list page
The admin dashboard SHALL provide an orders page at `/dashboard/orders` that replaces the "Coming Soon" placeholder, listing the tenant's orders with order number, date, customer, status and payment badges, and totals, plus controls to filter by status and search; each row links to the order's detail page.

#### Scenario: Browse orders
- **WHEN** an authenticated OWNER/ADMIN staff member opens `/dashboard/orders`
- **THEN** the tenant's orders are listed newest-first with their statuses and totals, and each row links to its detail page

#### Scenario: Filter orders from the page
- **WHEN** the staff member applies a status filter or search term on the orders page
- **THEN** the list shows only the matching orders

#### Scenario: Unauthenticated access redirected
- **WHEN** a visitor without a staff session navigates to `/dashboard/orders`
- **THEN** they are redirected to the login page

### Requirement: Admin order detail page
The admin dashboard SHALL provide an order detail page at `/dashboard/orders/[id]` showing the order's items (by product name), customer contact, shipping address, totals, and current status, with actions to perform the next valid status transition and to cancel the order while it is cancellable; invalid or unavailable actions SHALL NOT be offered.

#### Scenario: View an order detail page
- **WHEN** an authenticated staff member opens `/dashboard/orders/[id]` for an existing tenant order
- **THEN** the full order is displayed, including items identified by product name

#### Scenario: Advance status from the page
- **WHEN** staff use the next-status action on a `CONFIRMED` order
- **THEN** the order advances to `SHIPPED` and the page reflects the new status

#### Scenario: Cancel from the page
- **WHEN** staff cancel a `PENDING` order from the detail page and confirm the action
- **THEN** the order becomes `CANCELLED`, inventory is restored, and the page shows the cancelled state with no further status actions
