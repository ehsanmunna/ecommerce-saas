## Purpose

Gives shoppers a customer-facing web application — the page set from
system-design.md's storefront inventory, rendered per-tenant and wired to
the existing storefront-facing APIs — so a tenant's catalog, cart, and
checkout are actually usable by a real visitor, not just reachable by API
calls.

## ADDED Requirements

### Requirement: Storefront pages render only the resolved tenant's data
Every storefront page SHALL show catalog, cart, order, and account data
belonging only to the tenant resolved for that request, using the same
resolution mechanism as the rest of the platform (subdomain in
production, a dev-only tenant header locally).

#### Scenario: Browsing a tenant's shop
- **WHEN** a visitor loads the Shop page on a resolved tenant's storefront
- **THEN** only that tenant's active products are shown

#### Scenario: Cross-tenant data never shown
- **WHEN** a visitor's request resolves to tenant A
- **THEN** no data belonging to any other tenant appears on any storefront
  page for that request

### Requirement: Checkout and account pages require a logged-in customer
Pages that require an authenticated customer (Cart, Checkout, My Account,
Order Details/Tracking) SHALL redirect an unauthenticated visitor to
Login rather than rendering, consistent with the backend's requirement
that carts and checkout belong to a logged-in customer.

#### Scenario: Unauthenticated visitor reaches Checkout
- **WHEN** a visitor without a customer session navigates to Checkout
- **THEN** they are redirected to the Login page instead

#### Scenario: Authenticated customer reaches Checkout
- **WHEN** a logged-in customer with items in their cart navigates to
  Checkout
- **THEN** the Checkout page renders using their cart's current contents

### Requirement: A single default visual theme is applied consistently
The storefront SHALL apply one consistent set of visual tokens (colors,
fonts) across every page, sourced from named theme tokens rather than
values fixed per page or per component, so the same tokens can later be
made tenant-configurable without a page-by-page rewrite.

#### Scenario: Consistent branding across pages
- **WHEN** a visitor navigates from Home to Checkout
- **THEN** the same primary color, secondary color, and fonts are used on
  both pages

### Requirement: Product Details shows one product with its variants
The Product Details page SHALL display a single product's information —
including its selectable variants (e.g. size/color) — for the product the
visitor navigated to, and SHALL show a not-found state for a product that
does not exist or is inactive.

#### Scenario: Viewing an existing active product
- **WHEN** a visitor opens the Product Details page for an active product
- **THEN** that product's details and its variants are displayed

#### Scenario: Viewing an inactive or nonexistent product
- **WHEN** a visitor opens the Product Details page for a product that is
  inactive or does not exist
- **THEN** a not-found state is shown instead of product data

### Requirement: Cart and order totals reflect the backend's computed values
The Cart, Checkout, and Order Confirmation pages SHALL display
subtotal, shipping, and total values as computed and returned by the
cart/checkout APIs, and SHALL NOT compute or display totals derived
independently on the client.

#### Scenario: Cart totals match the API
- **WHEN** the cart API returns a subtotal, shipping, and total for the
  current cart
- **THEN** the Cart page displays exactly those values

### Requirement: Static content pages render without authentication
About Us, Contact Us, FAQ, Privacy Policy, Terms & Conditions, Shipping &
Delivery Policy, and Return & Refund Policy SHALL be reachable and fully
rendered for a visitor with no customer session.

#### Scenario: Visiting a policy page while logged out
- **WHEN** a visitor with no customer session opens the Return & Refund
  Policy page
- **THEN** the page renders its full content

### Requirement: Forgot Password is present but its submission is stubbed
The Forgot Password page SHALL render its form per the design, and SHALL
show a clear "not yet available" message on submission instead of sending
a reset email, since no email-sending infrastructure exists in this
system yet.

#### Scenario: Submitting the Forgot Password form
- **WHEN** a visitor submits the Forgot Password form with an email
- **THEN** no reset email is sent, and the visitor sees a message stating
  the feature is not yet available
