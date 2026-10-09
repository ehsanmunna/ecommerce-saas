## Why

Orders can be placed and tracked by customers, but store staff have no way to actually work them: the admin `/dashboard/orders` page is a "Coming Soon" placeholder, the admin API exposes only a single status PATCH with no list or detail endpoints, and order details everywhere show raw variant IDs instead of product names.

## What Changes

- Add staff order list and order detail endpoints (with search, status/payment filters, and pagination) to the API, plus staff order cancellation alongside the existing forward-only status transitions.
- Add `listOrders` / `getOrder` / `updateOrderStatus` / `cancelOrder` functions to the admin API client.
- Replace the admin `ComingSoon` orders page with a real order list page (filters, pagination, status badges) and an order detail page (items, shipping, totals, status timeline, status advance / cancel actions).
- Make order items identify themselves by product name (with variant options) in both admin and storefront views, instead of raw variant IDs.
- Payments remain stubbed (`paymentStatus` stays `PENDING`); no payment gateway is added.

## Capabilities

### New Capabilities
- `admin-order-management`: staff-facing order operations — list/filter orders, view full order detail, advance order status, and cancel an order — exposed through both the API and the admin dashboard UI.

### Modified Capabilities
- `order-checkout`: order details (customer- and staff-facing) SHALL identify each order item by product name rather than an opaque variant id.

## Impact

- `apps/api/src/modules/orders/` — `orders.service.ts` (staff list/detail/cancel), `orders-admin.controller.ts` (new endpoints), new list-orders DTO.
- `apps/api/src/modules/orders/orders.module.ts` — imports if new dependencies are needed.
- `apps/admin/app/lib/api-client.ts` — new order API functions and types.
- `apps/admin/app/dashboard/orders/` — new list and detail pages replacing `ComingSoon`.
- `apps/storefront/app/orders/[id]/page.tsx`, `app/order-confirmation/[id]/page.tsx`, `app/account/page.tsx` — render product names.
- `packages/types/src/index.ts` — shared order view types if extended.
- No schema migration expected (product name resolved by join; see design.md), no changes to checkout, cart, inventory, or payment behavior.
