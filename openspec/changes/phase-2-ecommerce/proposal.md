## Why

Phase 1 (`phase-1-saas-foundation`) built the SaaS shell — tenants can
register, get an isolated database, resolve by host, and staff can log in
to a dashboard — but there is nothing to actually sell yet. The design
doc's own "Phase 2 — Ecommerce" (section 29) and the storefront page
inventory (section 33) both describe the same next step: products,
categories, customers, cart, orders, and inventory. This change builds
that data model and the backend APIs it needs, so the platform can hold
real store data even before a customer-facing storefront UI exists.

## What Changes

- Add a product catalog: products, categories, and per-product variants
  (e.g. size/color), with browse/search/filter/sort/pagination support
  matching the "Shop / Products" and "Category" pages from section 33.
- Add inventory tracking per product/variant, decremented when an order is
  placed, and never allowed to go negative (no overselling).
- Add customer accounts: a storefront-facing identity distinct from the
  tenant staff/admin users built in Phase 1 — registration, login, profile,
  and saved addresses. Password reset is deferred (no email-sending
  infrastructure exists yet in this codebase).
- Add a shopping cart: items, quantity updates, removal, a coupon code
  applied at checkout time, and computed subtotal/shipping/total.
- Add checkout and orders: placing an order from a cart (shipping address,
  delivery method, a chosen payment method), an order status lifecycle, and
  an order-details/tracking view. Payment is **stubbed** — orders carry a
  payment status field, but no real payment gateway is integrated (none has
  been chosen yet; see the earlier explore-mode discussion). Real payment
  processing is a separate future change.
- **No new frontend in this change.** `apps/storefront` is not scaffolded;
  everything here is backend (NestJS modules + Prisma schema + API). The
  customer-facing pages in section 33 (Home, Shop, Product Details, Cart,
  Checkout UI, My Account UI, etc.) are a follow-up change once these APIs
  exist to build against.
- Reviews and wishlist (both mentioned on section 33's Product Details and
  a dedicated Wishlist page) are **not** part of this change — the design
  doc's own Phase 2 build list (section 29) doesn't include them either;
  they're deferred to a later change.

## Capabilities

### New Capabilities
- `product-catalog`: products, categories, and variants, with
  browsing/search/filter/sort/pagination.
- `inventory`: per-product/variant stock tracking, decremented on order
  placement, with oversell prevention.
- `customer-accounts`: storefront customer registration, login, profile,
  and saved addresses — a separate identity space from tenant staff users.
- `shopping-cart`: cart items, quantity changes, removal, coupon
  application, and computed totals.
- `order-checkout`: placing an order from a cart, a stubbed payment status,
  an order status lifecycle, and order details/tracking.

### Modified Capabilities
- None. Phase 1's `tenant-provisioning`, `tenant-resolver`, `auth`, and
  `tenant-dashboard` capabilities are unchanged — this change adds new,
  additive tenant-database tables and modules alongside them.

## Impact

- Tenant Prisma schema (`prisma/tenant/schema.prisma`): new models for
  products, categories, variants, inventory, customers, customer addresses,
  carts, cart items, orders, order items, and coupons — plus a new
  migration.
- New NestJS modules in `apps/api/src/modules/`: `catalog` (products +
  categories), `inventory`, `customers` (storefront accounts), `cart`,
  `orders`.
- New customer-facing auth path, parallel to but distinct from the
  existing staff `auth` module — needs its own guard/strategy so a
  customer token can never be used against staff/admin routes and vice
  versa (see design.md).
- No changes to the Platform DB, to tenant provisioning, or to the
  existing admin dashboard shell.
- No new external dependencies expected beyond what Prisma/NestJS already
  provide — no payment SDK, no email provider (both explicitly deferred).
