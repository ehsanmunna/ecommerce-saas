## 1. Backend prerequisites

- [x] 1.1 Add `GET /storefront/products/:id` to
      `StorefrontCatalogController` — returns one active product with its
      variants; 404 for inactive/unknown (the `Product` model has no
      `slug` field, only `id` — the spec's "slug (or id)" wording already
      allowed for this)
- [x] 1.2 Add `STOREFRONT_APP_ORIGIN` env var and widen `apps/api`'s CORS
      config to allow-list it alongside `ADMIN_APP_ORIGIN`
- [x] 1.3 Document both in `apps/api/.env.example`

## 2. Scaffold apps/storefront

- [x] 2.1 Create `apps/storefront` Next.js app, added to the npm
      workspace (mirror `apps/admin`'s `package.json`/`tsconfig`/Tailwind
      setup)
- [x] 2.2 Add `apps/storefront/.env.example` with `NEXT_PUBLIC_API_URL`
- [x] 2.3 Add `npm run dev:storefront` at the repo root
- [x] 2.4 Copy `docs/html_design_template/assets/*` into
      `apps/storefront/public/` as the default theme's image assets

## 3. Theme tokens

- [x] 3.1 Extract the design's palette/fonts into a token module
      (`app/lib/theme.ts`) — values equal "Frozen"'s design for now
- [x] 3.2 Wire the token module into the Tailwind/CSS setup (CSS
      variables in `globals.css`, mapped in `tailwind.config.ts`) so every
      component consumes tokens, never literal color values

## 4. Tenant resolution & customer session

- [x] 4.1 Tenant resolution: `NEXT_PUBLIC_DEV_TENANT_SLUG` sent as
      `x-tenant-slug` on every request in dev (see `.env.example` — one
      dev server instance is pinned to one tenant, same as production
      pins one hostname to one tenant via subdomain; unlike admin's
      per-login-form slug entry, a storefront has no anonymous-browsing
      equivalent of a login form to type a slug into)
- [x] 4.2 Build `api-client.ts` for the customer API surface
      (`/storefront/*`), parallel to but separate from admin's
- [x] 4.3 Implement customer session storage under a distinct
      `localStorage` key (`ecommerce-saas.customer-session`), never
      shared with the staff `Session` type
- [x] 4.4 Implement a route guard/redirect: Cart, Checkout, My Account,
      Order Details redirect to Login when no customer session exists
      (`useRequireAuth` hook, used by each of those pages)

## 5. Auth pages

- [x] 5.1 Login page — calls `POST /storefront/auth/login`
- [x] 5.2 Register page — calls `POST /storefront/auth/register`
- [x] 5.3 Forgot Password page — renders the form; submission shows a
      "not yet available" message, no request sent (per design.md)
- [x] 5.4 Logout — calls `POST /storefront/auth/logout`, clears session
      (implemented as a Sign Out action on the My Account page — see 8.1)

## 6. Catalog pages

- [x] 6.1 Home page — hero banner, category tiles from real categories,
      "New Collections" product grid from `GET /storefront/products`
      (the design's "Happy Customers" review section is omitted — reviews
      are deferred with no backend to source them from, same reasoning as
      the Wishlist/review-section deferral in proposal.md)
- [x] 6.2 Shop/Products page — search, filter (single-select category,
      price presets), sort, "load more" pagination against
      `GET /storefront/products`
- [x] 6.3 Category page — `GET /storefront/categories` +
      `GET /storefront/categories/:slug/products`, sharing the Shop
      page's `ProductBrowser` component with a fixed category
- [x] 6.4 Product Details page — `GET /storefront/products/:id` (task
      1.1); variant selection (generic attribute-key matching, not
      hardcoded to size/color); not-found state for inactive/unknown

## 7. Cart & checkout

- [x] 7.1 Cart page — items, quantity update, removal, coupon apply/remove
      via `/storefront/cart*`; totals rendered exactly as returned by the
      API (no client-side computation)
- [x] 7.2 Checkout page — shipping address (including saved addresses via
      `GET /storefront/me`), delivery method, payment method selection,
      order summary, `POST /storefront/checkout` (payment method is a
      pending-payment selector, not card-number/CVC inputs — no gateway
      exists to send them to, and collecting card data nothing processes
      would be actively misleading, not just incomplete)
- [x] 7.3 Order Confirmation page — renders the order returned by checkout

## 8. Account & orders

- [x] 8.1 My Account page — profile view/update via `GET|PATCH
      /storefront/me`; saved addresses via `POST|DELETE
      /storefront/me/addresses/:id` (no address-update endpoint exists,
      only create/delete, so there's no Edit action — matches the actual
      API surface); includes the Sign Out action from task 5.4
- [x] 8.2 Order Details/Tracking page — `GET /storefront/orders/:id`
      (status-sequence stepper in place of unbuilt carrier tracking; order
      items show variant id, not product name — `OrderItem` stores no
      product-name snapshot)
- [x] 8.3 Order history list (within My Account) —
      `GET /storefront/orders`
- [x] 8.4 Order cancellation action — `POST /storefront/orders/:id/cancel`

## 9. Static supporting pages

- [x] 9.1 About Us, Contact Us, FAQ — static content per design; Contact
      Us uses a placeholder for tenant contact details (no settings API
      yet, per design.md non-goals) and its message form is stubbed (no
      backend to receive it), same treatment as Forgot Password
- [x] 9.2 Privacy Policy, Terms & Conditions, Shipping & Delivery Policy,
      Return & Refund Policy — static content per design, worded to match
      what the backend actually does (e.g. returns route to Contact Us —
      there is no automated return workflow, only order cancellation)

## 10. Verification

- [ ] 10.1 Manually walk the full flow end-to-end against a real
      provisioned tenant: register → browse → add to cart → checkout →
      view order → view order details
- [ ] 10.2 Confirm a second tenant's storefront shows none of the first
      tenant's data (products, cart, orders)
- [ ] 10.3 Confirm a customer token is rejected on staff/admin routes and
      a staff token is rejected on `/storefront/*` routes requiring a
      customer
- [ ] 10.4 Confirm `apps/admin` still works unaffected (CORS widening
      didn't regress the existing admin origin)
