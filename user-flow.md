# User Flow: Tenant Registration → Storefront Checkout

This is the full, grounded pipeline from registering a brand-new tenant to
a customer completing a purchase on that tenant's storefront — every step
below maps to code that actually exists today, using real endpoint paths
and payload shapes. It's a runnable walkthrough, not aspirational.

## 0. Running

```bash
docker compose up -d postgres     # Postgres, port 55432
npm run dev:api                   # NestJS,   :3001
npm run dev:admin                 # Next.js,  :3000
npm run dev:storefront            # Next.js,  :3002
```

See [`README.md`](README.md) for first-time setup (installing dependencies,
copying `.env.example` files, applying the platform migration).

## 1. Tenant registration

Platform-level — no tenant context exists yet. Use the public signup page at
`http://localhost:3000/signup`, or the API directly:

```bash
curl -X POST http://localhost:3001/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Acme Inc",
    "slug": "acme",
    "ownerEmail": "owner@acme.test",
    "ownerPassword": "supersecret123",
    "plan": "BASIC"
  }'
```

This creates the tenant as `PENDING_VERIFICATION` and sends a verification
email (set `SMTP_HOST` etc. in `apps/api/.env` to send real email; without
SMTP the link is logged to the API console and returned as `verificationToken`
in the response). Verify via the email link or:

```bash
curl -X POST http://localhost:3001/tenants/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "<verificationToken>"}'
```

On success `TenantProvisioningService` runs: creates the `tenant_acme`
Postgres database, applies the tenant Prisma migration, seeds default roles,
creates the owner `User` row, and default `Settings`/`Theme` rows. Returns
once `status: "ACTIVE"`.

## 2. Staff login

To get a token that can manage the catalog.

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-slug: acme" \
  -d '{"email": "owner@acme.test", "password": "supersecret123"}'
# → { accessToken, refreshToken, user: { id, email, role: "OWNER" } }
```

This is the *staff* JWT (`JWT_ACCESS_SECRET`) — structurally incompatible
with the customer JWT from step 5. It's the same token the `admin` app
gets when you sign in at `localhost:3000/login`.

## 3. Seed the catalog

Nothing shows up on the storefront until this exists. The admin
dashboard's Products page is still a "Coming soon" stub (Phase 1), so
today this only happens via the API directly.

```bash
STAFF_TOKEN="<accessToken from step 2>"

# a) category
curl -X POST http://localhost:3001/categories \
  -H "Content-Type: application/json" -H "x-tenant-slug: acme" -H "Authorization: Bearer $STAFF_TOKEN" \
  -d '{"name": "Hoodies", "slug": "hoodies"}'
# → { id: "<categoryId>", ... }

# b) product (needs categoryId from above)
curl -X POST http://localhost:3001/products \
  -H "Content-Type: application/json" -H "x-tenant-slug: acme" -H "Authorization: Bearer $STAFF_TOKEN" \
  -d '{"name": "Cotton Hoodie", "price": 38.00, "categoryId": "<categoryId>"}'
# → { id: "<productId>", isActive: true, ... }

# c) variant (needs productId — a product with ZERO variants can't be added
#    to a cart at all, since CartService.addItem requires a variantId)
curl -X POST http://localhost:3001/products/<productId>/variants \
  -H "Content-Type: application/json" -H "x-tenant-slug: acme" -H "Authorization: Bearer $STAFF_TOKEN" \
  -d '{"sku": "HOOD-M-RED", "attributes": {"size": "M", "color": "Red"}, "stock": 20}'
```

That last step is the one gap most likely to trip you up: a product with
no variant shows up on Home/Shop (browsing includes it) but its Product
Details page will show "Out of Stock" / nothing addable, because there's
genuinely nothing purchasable yet.

## 4. Point the storefront at this tenant

Edit `apps/storefront/.env.local`:

```
NEXT_PUBLIC_DEV_TENANT_SLUG=acme
```

Restart `npm run dev:storefront` — Next.js only reads env files at
startup. One dev server instance is pinned to one tenant's storefront
right now, mirroring how one hostname maps to one tenant in production.

## 5. Shop as a customer

Open `http://localhost:3002`.

```
Home (/)                    → GET /storefront/products, /storefront/categories
     │  "Cotton Hoodie" now appears in New Collections
     ▼
Product Details (/product/<id>)
     │  select Size=M / Color=Red → resolves to the variant you created
     │  Add to Cart → not logged in yet → redirected to
     ▼
Register (/register) → POST /storefront/auth/register
     │  (no session issued — register ≠ login on this backend)
     ▼
Login (/login) → POST /storefront/auth/login
     │  customer JWT stored, redirected back to the product page
     ▼
Add to Cart → POST /storefront/cart/items
     ▼
Cart (/cart) → GET/PATCH/DELETE /storefront/cart*
     ▼
Checkout (/checkout) → POST /storefront/checkout
     │  atomically: decrements variant stock, creates Order, clears cart
     ▼
Order Confirmation (/order-confirmation/<orderId>)
     ▼
My Account → Orders → Order Details/Tracking (/orders/<orderId>)
```

## Known gaps this walkthrough exposes

1. **The admin dashboard can't do step 3 yet.** Its Products/Orders/Customers
   pages are still `ComingSoon` stubs from Phase 1 — so right now the
   *only* way to get a tenant from "just registered" to "has something to
   sell" is raw `curl` against the API. That's the real seam between
   `add-storefront-frontend` (done) and wiring up the admin dashboard (not
   started) — a store owner has no UI to add their own products yet.
2. **Wishlist and product reviews don't exist** — deferred in
   `phase-2-ecommerce` (no backend) and correspondingly not built in
   `add-storefront-frontend` (no page).
3. **Payment is stubbed.** Checkout collects a payment *method* selection,
   not real payment details — no gateway is integrated, and every order's
   `paymentStatus` stays `PENDING`.
4. **Per-tenant branding is fixed, not dynamic.** Every tenant's storefront
   currently renders with the same default theme (see
   `openspec/changes/add-storefront-frontend/design.md`) — there is no
   settings/theme API yet, so a second tenant looks identical to the
   first, just with different products.
