## Context

`apps/admin` (Next.js) already establishes the pattern this change reuses:
tenant resolution via `x-tenant-slug` in dev / subdomain in production, a
thin `api-client.ts` wrapping `fetch` with tenant/auth headers, and a
browser-`localStorage` session. `apps/api` already exposes the storefront
surface `phase-2-ecommerce` built, all mounted under `/storefront`:

- `GET /storefront/products`, `GET /storefront/categories`,
  `GET /storefront/categories/:slug/products` — browse/search/filter/sort
  (no single-product-detail route exists yet — see product-catalog spec)
- `GET|POST|PATCH|DELETE /storefront/cart`, `/storefront/cart/items/:id`,
  `/storefront/cart/coupon`
- `POST /storefront/checkout`, `GET /storefront/orders`,
  `GET /storefront/orders/:id`, `POST /storefront/orders/:id/cancel`
- `POST /storefront/auth/{register,login,refresh,logout}` — a customer
  JWT, signed with its own secret, structurally incompatible with the
  staff JWT `apps/admin` uses
- `GET|PATCH /storefront/me`, `POST|DELETE /storefront/me/addresses/:id`

`apps/api`'s CORS is currently hardcoded to one origin
(`ADMIN_APP_ORIGIN`). There is no controller anywhere for the tenant
`Settings`/`Theme` tables — Phase 1 only ever wrote default rows during
provisioning; nothing reads them back, for admin or storefront.

`docs/html_design_template/` is 20 `.dc.html` pages (Claude Design canvas
export, brand "Frozen") — inline-styled markup plus a `support.js` canvas
runtime not meant to ship. A palette scan found the design is not
arbitrary: ~10 `rgb()` values account for the large majority of color
usage, clustering into clear roles (accent pair, text, neutrals), plus two
Google Fonts (Inter, Montserrat).

## Goals / Non-Goals

**Goals:**
- Ship a working storefront app a real visitor can shop through, for
  every tenant, using the existing backend as-is wherever possible.
- Keep the design's visual fidelity intact while making its colors/fonts
  swappable later, without redesigning components to do it.

**Non-Goals:**
- Dynamic per-tenant branding (a settings/theme API, an admin UI to edit
  it). The schema and every controller for it are absent; adding them is
  its own change. This change ships one fixed default theme for all
  tenants.
- Payment processing, email delivery, wishlist/review persistence — all
  already out of scope per `phase-2-ecommerce`; this change doesn't
  reopen them.
- Any change to `apps/admin` or the Platform DB.

## Decisions

### Extract the design's palette into named tokens, not literal colors
**Why**: the design hardcodes `rgb(...)` per element; the app's own
architecture doc (§14) requires one codebase serving N tenants with
config-driven branding. Copying the design's inline styles verbatim would
mean redoing every component later to introduce tokens.
**Approach**: a small token module (`primary`, `primaryHover`, `text`,
`textMuted`, `background`, `border`, plus the two font families) whose
values today equal "Frozen"'s palette. Components reference tokens, never
raw `rgb()`. Swapping to per-tenant values later is then a data-source
change, not a component rewrite.
**Alternative considered**: port the design's inline styles as-is and
defer tokenization to the future branding change. Rejected — every
component would need touching twice instead of once.

### Add one product-detail endpoint rather than working around its absence
**Why**: the Product Details page needs one product's full data
(including variants); the only existing route is the paginated browse
list. Fetching the whole catalog client-side to find one product doesn't
scale and leaks inactive-product handling into the frontend.
**Approach**: `GET /storefront/products/:slug` in the existing
`StorefrontCatalogController`, per the `product-catalog` delta spec.
**Alternative considered**: filter the existing list endpoint by slug
client-side. Rejected — wrong shape (paginated collection vs single
resource), and duplicates not-found logic the backend already owns for
"inactive/unknown" elsewhere in catalog.

### Reuse `apps/admin`'s tenant-resolution and API-client pattern exactly
**Why**: it's already proven (Phase 1 dashboard, Phase 2 backend built
against it) and the storefront has identical needs — dev-header tenant
resolution, a typed fetch wrapper, a stored session — just for a
different (customer) identity.
**Approach**: same `x-tenant-slug` dev convention, same
`NEXT_PUBLIC_API_URL` env var, a parallel `Session` shape storing the
customer's tokens under a distinct storage key so an admin and storefront
session can coexist in the same browser during local dev.
**Alternative considered**: a shared `packages/` API-client package.
Rejected for this change — only two call sites exist so far
(`apps/admin`, `apps/storefront`) and their auth/session shapes already
diverge (staff vs customer); premature to abstract now.

### Stub Forgot Password submission and defer Wishlist/reviews entirely
**Why**: mirrors `phase-2-ecommerce`'s own precedent (payment is stubbed,
not omitted) applied consistently — Forgot Password has a page shell in
the design but no email backend to submit to, so it's stubbed the same
way. Wishlist and reviews have no backend *at all* (deliberately deferred
upstream), so there is nothing to stub against — building that UI now
would be thrown away when the real capability lands.
**Alternative considered**: build Wishlist against `localStorage` only
(no account sync). Rejected — would silently lose items on device change
with no indication why, and blurs the line for a future change that adds
real wishlist persistence.

### Widen CORS with a second explicit origin, not a wildcard
**Why**: `apps/api` currently allows exactly one origin. Two known
frontend origins now exist.
**Approach**: add a `STOREFRONT_APP_ORIGIN` env var alongside
`ADMIN_APP_ORIGIN`, both explicitly allow-listed.
**Alternative considered**: `origin: true` (reflect any origin). Rejected
— the API serves authenticated, tenant-scoped data; an open CORS policy
would let any third-party site call it with a visitor's credentials.

## Risks / Trade-offs

- **[Risk]** A visible gap between "looks fully themeable" (tokens) and
  "is actually themeable" (no API yet) could read as a half-finished
  feature. → Mitigation: name it explicitly as a Non-Goal here and in the
  proposal; the token layer is a deliberate seam, not an oversight.
- **[Risk]** Two browser sessions (staff, customer) on `localhost` during
  dev, differentiated only by storage key, is easy to cross wires on
  manually. → Mitigation: distinct, clearly-named storage keys
  (`ecommerce-saas.session` for staff already exists; use
  `ecommerce-saas.customer-session` for the new one) and never share the
  `Session` TypeScript type between them.
- **[Trade-off]** Building 19 of 20 designed pages in one change is a
  large surface. → Mitigation: the `product-catalog` delta is the only
  backend dependency; every other page needs no new API, so pages can be
  implemented and reviewed incrementally without cross-page blocking.

## Open Questions

- Should `apps/storefront` be containerized alongside `apps/api` sooner
  than "Phase 6 — Production DevOps" (per the architecture doc), or
  stay native-`npm run dev` like `apps/admin` does today? Doesn't affect
  this change's specs or task breakdown either way — can be answered when
  deployment is actually planned.
