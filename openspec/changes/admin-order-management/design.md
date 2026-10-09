## Context

See proposal.md for motivation. Relevant current state:

- Backend order module exists (`apps/api/src/modules/orders/`): transactional `checkout`, customer `listOrders`/`getOrder`/`cancelOrder`, and a staff-only `PATCH /orders/:id/status` with forward-only transitions (`PENDING → CONFIRMED → SHIPPED → DELIVERED`). `OrdersService` has no staff list/detail/cancel.
- Admin `/dashboard/orders` is a `ComingSoon` placeholder; `apps/admin/app/lib/api-client.ts` has no order functions.
- Storefront cart/checkout/order pages exist. Cart views already expose `productName` (resolved in `cart.service.ts` via `variant.product.name`), but order endpoints return raw `items` with only `variantId`; `apps/storefront/app/orders/[id]/page.tsx` renders `(SKU: {item.variantId.slice(0, 8)})`.
- `OrderItem` has a Prisma relation `variant ProductVariant` → `product Product`, so names resolve by join with no schema change.
- Tenancy is DB-per-tenant (`req.tenantDb`); staff auth is `JwtAuthGuard` + `RolesGuard` + `@Roles('OWNER','ADMIN')` (existing orders admin controller already does this).

## Goals / Non-Goals

**Goals:**

- Staff can list/filter/search orders and open a full order detail through API and admin UI.
- Staff can advance status (existing endpoint) and cancel a non-shipped order with inventory restore.
- Order items render product name + variant attributes in both storefront and admin views.

**Non-Goals:**

- Payment gateway integration; `paymentStatus` remains stubbed `PENDING` (no admin "mark paid" action).
- Order edits (address/line-item mutation), refunds, order notes, emails, invoices.
- New roles/permissions (reuse `OWNER`/`ADMIN`), schema migrations, Swagger decoration of order endpoints (consistent with other phase-2 endpoints).

## Decisions

### 1. Product names resolved at read time, not snapshotted

Resolve `productName`/`sku`/`attributes` via Prisma include (`items → variant → product`), exactly as `cart.service.ts` already does.

- **Why:** no migration, works for pre-existing orders, one consistent resolution path with the cart.
- **Alternative rejected:** snapshotting `productName` onto `OrderItem` at checkout — historical accuracy if a product is renamed, but requires a migration + backfill and a join fallback anyway (products are never hard-deleted; only status changes), so the added complexity isn't justified now. If historical names ever matter, that's a follow-up change.
- **Fallback:** if a variant/product row is somehow missing, expose `sku` (or a variant-id prefix) as the display label; the detail view must never break.

### 2. Staff endpoints added to the existing `OrdersAdminController`

- `GET /orders` — filters: `status` (`OrderStatus`), `paymentStatus` (`PaymentStatus`), `search` (matches `shippingRecipient` or related `customer.email`, case-insensitive `contains`), `page`/`pageSize` (default 20, max 100) — mirroring `ListProductsDto` and the catalog pagination contract `{ items, total, page, pageSize }`.
- `GET /orders/:id` — includes `customer { id, email, firstName, lastName }` and items with resolved product data; `404` for unknown/foreign id.
- `POST /orders/:id/cancel` — staff cancel; `400` unless status is `PENDING`/`CONFIRMED`.
- `PATCH /orders/:id/status` — unchanged (already implements forward-only transitions; `400` on skip/backward/`CANCELLED`).

- **Why:** follows the module's existing two-controller layout; services keep taking `tenantDb: TenantPrismaClient` as first arg; guards/roles already declared on the controller.
- **Why `POST .../cancel` instead of `DELETE /orders/:id`:** orders are never deleted; mirrors the existing storefront route `POST /storefront/orders/:id/cancel`.

### 3. Cancel logic factored into one internal helper

Extract the stock-restore + status-set transaction from the customer `cancelOrder` into a private helper (e.g. `performCancel(tenantDb, order)`); customer cancel keeps its ownership check, staff cancel does not.

- **Why:** single source of truth for the inventory-restore invariant (spec requires both paths restore stock identically).
- **Alternative rejected:** duplicating the transaction in a staff method — drift risk.

### 4. Read models: plain object mapping, no DTO classes for responses

Map Prisma rows to a view shape in the service (as `cart.service.ts` does for `CartView`): decimal fields serialized to numbers/strings consistent with existing endpoints. Request validation uses `class-validator` DTOs (`ListOrdersDto`), response shapes are implicit — matching how catalog/cart endpoints already behave.

### 5. Admin UI follows the products page pattern

- `apps/admin/app/dashboard/orders/page.tsx` — client component: status + payment filter selects, search input, table (order short-id, date, customer email, status badge, payment badge, total), row links to detail. No component library/react-query; plain `useState` + `api-client`, matching `products/page.tsx`.
- `apps/admin/app/dashboard/orders/[id]/page.tsx` — order summary (status, dates, totals, coupon), customer block, shipping address block, items table (product name, attributes, qty, unit price, line total), and an actions area: "advance to <next status>" button (only when a next step exists) and "Cancel order" (only while `PENDING`/`CONFIRMED`) with a `confirm()` dialog; on cancel, show cancelled state with no further actions.
- Sidebar nav already contains `/dashboard/orders` (phase-1 `NAV_ITEMS`); only the `ComingSoon` placeholder is replaced.
- **API client:** add `listOrders`, `getOrder`, `updateOrderStatus`, `cancelOrder` + `AdminOrder`/`AdminOrderItem`/`AdminOrderListResult` types to `apps/admin/app/lib/api-client.ts`, reusing the existing session/`x-tenant-slug` fetch wrapper.

### 6. Storefront gap fix is minimal

- Extend the storefront `OrderView`/`OrderItemView` types and the two order endpoints' payloads with `productName`, `sku`, `attributes`.
- `app/orders/[id]/page.tsx`: render `productName` + variant attributes instead of the `variantId.slice(0,8)` pseudo-SKU (keep id slice only as fallback).
- `app/order-confirmation/[id]/page.tsx`: render `productName` for each item (currently shows raw items).
- Cart/checkout already show names — untouched.

## Risks / Trade-offs

- [Read-time join shows the product's *current* name, not the name at purchase time] → Accepted for now; products aren't hard-deleted so labels always resolve; snapshotting is a self-contained follow-up if rename history matters.
- [Search over `customer.email` requires a relation filter; inefficient `contains` on large tenants] → Acceptable at current scale (per-tenant DBs, seeded/demo data); no index work in this change.
- [Staff cancel and customer cancel share a helper but differ in guard rails (ownership vs role)] → Both paths validated: customer keeps `customerId` check, staff behind `JwtAuthGuard`/`RolesGuard`; cancel precondition (`CANCELLABLE_STATUSES`) enforced in the shared helper.
- [Status transitions remain one-step-only, which may annoy staff doing data entry] → Deliberate: matches existing spec/service behavior; bulk or direct set is out of scope.
- [No automated tests exist for the order module today] → Mitigated by `openspec validate` scenarios and manual verification steps in tasks.md; adding a test harness is out of scope.

## Migration Plan

None. No schema changes, no env vars, no deploy ordering concerns — API and both frontends ship together; the admin orders page simply replaces a placeholder.

## Open Questions

None — role scope (`OWNER`/`ADMIN` only, excluding `STAFF`), read-time name resolution, and endpoint shapes are decided above; payment integration is explicitly deferred per proposal.
