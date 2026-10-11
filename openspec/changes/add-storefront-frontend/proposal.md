## Why

Phase 1 built the SaaS shell (tenants, auth, a basic admin dashboard) and
`phase-2-ecommerce` built the backend for products, cart, checkout, and
customer accounts — but, by that change's own design, "no customer-facing
storefront UI exists" yet. A visual reference now exists too:
`docs/html_design_template/` is a full, page-by-page design (branded
"Frozen") covering every page in system-design.md's §33 storefront
inventory. Backend and design are both ready; the storefront app itself is
the missing piece.

## What Changes

- Scaffold `apps/storefront` (Next.js), mirroring `apps/admin`'s
  established pattern: tenant resolution via subdomain in production / an
  `x-tenant-slug` dev header locally, a `NEXT_PUBLIC_API_URL`-configured
  API client, and a browser-stored session — but for the separate
  *customer* identity (`/storefront/auth/*`), never the staff one.
- Implement the storefront pages from `docs/html_design_template/` and
  wire each to the matching `phase-2-ecommerce` API: Home, Shop/Products,
  Category, Product Details, Cart, Checkout, Order Confirmation, My
  Account, Order Details/Tracking, Login, Register, plus the static
  supporting pages (About Us, Contact Us, FAQ, Privacy Policy, Terms &
  Conditions, Shipping & Delivery Policy, Return & Refund Policy).
- Extract the design's palette (a consistent ~10-color set) and typography
  (Inter/Montserrat) into named theme tokens rather than literal inline
  colors, so the UI is structurally ready for per-tenant theming — but
  ship with the "Frozen" values as one fixed default theme for every
  tenant. A public branding/theme API and an admin UI to edit it do not
  exist yet (the `Settings`/`Theme` tables have no controller at all,
  admin or storefront); **true per-tenant dynamic branding is explicitly
  deferred**, not built here.
- **Stubbed, not omitted** — matching how `phase-2-ecommerce` already
  stubbed payment rather than leaving Checkout out entirely: Forgot
  Password's submission (no email-sending infrastructure exists) and any
  per-tenant contact details a static page would otherwise show (uses a
  placeholder). Both render per the design; neither is functional yet.
- **Deferred entirely, not built**: the Wishlist page and Product Details'
  review section. `phase-2-ecommerce` deliberately deferred wishlist and
  reviews on the backend (no persistence for either exists) — building UI
  with nothing to persist to would be thrown away later.
- Widen the API's CORS policy to also allow the storefront app's origin,
  alongside the existing admin-only `ADMIN_APP_ORIGIN`.

## Capabilities

### New Capabilities
- `storefront-web`: the customer-facing storefront application — its page
  set, tenant-aware rendering, default visual theme, and how it composes
  the existing storefront-facing APIs (catalog browsing, cart, checkout,
  customer accounts) into a working shopping experience.

### Modified Capabilities
- `product-catalog`: adds a single-product detail retrieval requirement.
  Today the API only exposes list/browse endpoints
  (`GET /storefront/products`, `GET /storefront/categories/:slug/products`)
  — nothing lets a client fetch one product (with its variants) directly,
  which the Product Details page needs.

## Impact

- New app: `apps/storefront` (Next.js/React), added to the npm workspace
  alongside `apps/admin` and `apps/api`.
- `apps/api`: a small addition to the `catalog` module (product detail
  endpoint) and a widened CORS configuration (new storefront origin env
  var, alongside `ADMIN_APP_ORIGIN`).
- No changes to the Platform DB, tenant provisioning, or the existing
  admin dashboard.
- No changes to the `Settings`/`Theme` schema or any new settings
  endpoint — dynamic per-tenant branding stays deferred, tracked as a
  known follow-up in design.md.
- `docs/html_design_template/` is consumed as a read-only visual
  reference; this change does not modify it.
