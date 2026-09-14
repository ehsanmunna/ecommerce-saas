## Context

See `proposal.md` (Why) for motivation. Phase 1 already established the
tenant Prisma schema pattern (`prisma/tenant/schema.prisma`: `Role`,
`User`, `RefreshToken`, `Settings`, `Theme`), a staff JWT auth flow
(`apps/api/src/modules/auth/`, `JwtStrategy` validating against `req.tenant`
from `TenantResolverMiddleware`), and a shared
`JwtAccessTokenPayload { sub, tenantId, role }` type in
`packages/types`. This change adds a second, parallel identity space
(storefront customers) and the commerce data model on top of that same
tenant database — it does not touch the Platform DB or tenant
provisioning.

## Goals / Non-Goals

**Goals:**
- A customer identity that is structurally impossible to confuse with a
  staff identity, even if someone reuses the wrong guard by mistake.
- Inventory decrement that's actually safe under concurrent checkouts, not
  just correct in the common case.
- Keep the tenant-resolution middleware pattern from Phase 1 (host-based,
  never trusting client-supplied identifiers) extended to every new route,
  not re-invented.

**Non-Goals:**
- Real payment gateway integration (proposal.md) — orders carry a stubbed
  payment status only.
- Password reset / any outbound email (proposal.md) — no email
  infrastructure exists yet.
- Guest checkout — carts and checkout require a logged-in customer. A cart
  with no owner is a meaningfully different feature (session-based,
  needs merge-on-login semantics); deferred rather than bolted on here.
- Real shipping-rate calculation — delivery method is a small fixed enum
  with a flat fee, not a carrier-rate API integration.
- Coupon usage limits / per-customer redemption limits — a coupon here is
  just a code, a discount type (percentage or fixed), a value, an expiry,
  and an active flag. Enforcing "one use per customer" or "max N total
  redemptions" is a reasonable follow-up, not required by the current
  `shopping-cart` spec.
- A storefront frontend, reviews, and wishlist (proposal.md).

## Decisions

### Customers are a separate model, not a `User` with a different role
A new `Customer` model (own table) holds storefront identities, distinct
from `User` (staff). This matches the design doc's own tenant schema
(section 6, `users` and `customers` as separate tables).
**Alternative considered**: adding a `CUSTOMER` role to the existing
`Role`/`User` tables. Rejected — staff and customers have fundamentally
different shapes (customers need saved addresses and no permissions;
staff need role-based permissions and no storefront-facing profile), and
mixing them in one table makes "a customer token must never work on a
staff route" a runtime check instead of a structural guarantee.

### Customer tokens use a separate signing secret, not just a claim check
Customer access tokens are signed with a new `JWT_CUSTOMER_ACCESS_SECRET`,
distinct from staff's `JWT_ACCESS_SECRET`. Each side's Passport strategy
(`JwtStrategy` for staff, a new `CustomerJwtStrategy`) only verifies
tokens signed with its own secret, plus still checks a `type` claim
(`'staff'` | `'customer'`) as defense in depth.
**Alternative considered**: one shared secret, discriminating purely by a
`type` claim inside `validate()`. Rejected — a shared secret means a bug
that skips or mis-checks that claim silently lets a customer token pass as
staff (privilege escalation into the admin dashboard). Separate secrets
make cross-use cryptographically impossible even if that check code has a
bug; the claim stays as a second, independent layer.

### Storefront routes get their own prefix and their own guard
New customer-facing endpoints are mounted under `/storefront/*`
(`/storefront/auth/*`, `/storefront/me`, `/storefront/products`,
`/storefront/categories`, `/storefront/cart`, `/storefront/orders`),
guarded where needed by a new `CustomerAuthGuard` (parallel to the
existing `JwtAuthGuard`). Product/category browsing under `/storefront/*`
requires tenant resolution but no login (public browsing), matching real
storefront UX.
Staff-facing catalog management (create/update/deactivate a product,
create/deactivate a coupon) stays under the existing staff-guarded
surface, gated by role: only `OWNER`/`ADMIN` may manage the catalog and
coupons; `STAFF` cannot. This is the first place Phase 1's seeded roles
need an actual authorization check beyond tenant cross-checking — add a
small `RolesGuard` reading the `role` claim already on the staff JWT.

### Tenant-resolution middleware now covers the new controllers
Phase 1 mounted `TenantResolverMiddleware` only on `AuthController` and
`MeController`. This change extends that `forRoutes(...)` list to every
new tenant-scoped controller (customer auth, storefront `/me`, catalog,
cart, orders) — tenant registration/status remain the only exemption, per
the `tenant-resolver` spec's existing platform-level-routes carve-out. No
spec change needed here: the spec already says "every tenant-scoped
request," this just grows the set of routes that count as tenant-scoped.

### Oversell prevention via a single conditional UPDATE, not read-then-write
Stock decrement uses one atomic conditional update per item — e.g.
(conceptually) `UPDATE variants SET stock = stock - :qty WHERE id = :id
AND stock >= :qty`, executed inside the order-placement transaction, and
the checkout fails if the affected-row count is zero. All items in a
checkout are decremented inside one Prisma `$transaction`, so a
mid-checkout failure decrements nothing.
**Alternative considered**: read current stock, check in application code,
then write. Rejected — this is a classic TOCTOU race: two concurrent
checkouts can both read "1 in stock" before either writes, both decide
they're allowed to proceed, and stock goes negative. A single
conditional `UPDATE ... WHERE stock >= qty` is atomic at the database
row level regardless of concurrent callers.

### One open cart per customer
A customer has at most one open cart at a time (get-or-create semantics),
not multiple named/saved carts.
**Alternative considered**: multiple carts per customer (e.g. "saved for
later"). Rejected as unnecessary complexity beyond what the
`shopping-cart` spec asks for.

### Minimal coupon management endpoint, staff-side
For the `shopping-cart` spec's "apply a coupon" requirement to be
testable at all, something has to be able to create one. This change adds
a small staff-only coupon create/list/deactivate endpoint (`OWNER`/`ADMIN`
only, same `RolesGuard` as catalog management) — not a full promotions
system, just enough for a coupon to exist to redeem.

## Risks / Trade-offs

- **[Risk]** Two JWT secrets (staff, customer) means two secrets to
  provision and rotate instead of one.
  → **Mitigation**: both are plain env vars following the same pattern as
  `JWT_ACCESS_SECRET` already does; no new infrastructure, just one more
  `.env` entry.
- **[Risk]** The conditional-UPDATE decrement pattern needs care to write
  correctly with Prisma (it doesn't have a first-class "conditional
  update" helper; this typically means `updateMany` with the stock
  condition in `where` and checking `count`).
  → **Mitigation**: covered explicitly in tasks.md with a dedicated
  concurrency test (two simultaneous checkouts for the last unit).
- **[Risk]** Introducing role-gated endpoints (`RolesGuard`) is new
  authorization surface Phase 1 didn't need (it only checked tenant
  identity, not permissions within a tenant).
  → **Mitigation**: scoped narrowly to catalog/coupon management only;
  existing staff routes (`/auth/*`, `/me`) are unaffected.
- **[Risk]** No payment gateway means an order can reach "placed" status
  without any real payment guarantee, which would be unacceptable for a
  real store.
  → **Mitigation**: explicitly called out as a Non-Goal and in
  proposal.md; a real payment integration is a clearly separate, future
  change once a provider is chosen.

## Migration Plan

Additive only: new tenant DB models and a new migration, new NestJS
modules, two new env vars (`JWT_CUSTOMER_ACCESS_SECRET`, plus whatever
default delivery-fee config is needed). No changes to the Platform DB, to
provisioning, or to any existing staff-facing endpoint's behavior.
Rollback is reverting the migration and removing the new modules.
