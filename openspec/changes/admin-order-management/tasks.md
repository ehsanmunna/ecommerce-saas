## 1. Backend — staff order endpoints

- [x] 1.1 Create `ListOrdersDto` in `apps/api/src/modules/orders/dto/` (`status`, `paymentStatus`, `search`, `page`, `pageSize` with the same validation style as `ListProductsDto`)
- [x] 1.2 Add a staff list method to `OrdersService`: paginated `{ items, total, page, pageSize }` newest-first, filtering by order/payment status, `search` matching `shippingRecipient` or related `customer.email`, including customer name/email
- [x] 1.3 Add a staff get-order method to `OrdersService` returning 404 for unknown/foreign ids, including customer and items with resolved `productName`/`sku`/`attributes` (join `variant → product`, fallback label when unresolvable)
- [x] 1.4 Extract the stock-restore + `CANCELLED` transaction from customer `cancelOrder` into a shared private helper and add a staff cancel method that skips the ownership check but enforces `PENDING`/`CONFIRMED` only
- [x] 1.5 Extend customer-facing `listOrders`/`getOrder` responses with resolved item `productName`/`sku`/`attributes` (same mapping as 1.3)
- [x] 1.6 Add `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel` to `OrdersAdminController` (guards/roles already on the controller; existing `PATCH /orders/:id/status` unchanged)

## 2. Backend verification

- [x] 2.1 Run `npm run build --workspace=apps/api` and `npm run lint --workspace=apps/api`; fix any errors
- [ ] 2.2 Manually verify via `/api/docs` or curl: staff list with each filter, search, pagination totals, 404 on foreign order id, 401/403 for missing/STAFF tokens
- [ ] 2.3 Manually verify status rules: forward one-step succeeds; skip/backward/`CANCELLED` transitions return 400
- [ ] 2.4 Manually verify staff cancel of a `PENDING` order restores variant stock, and cancel of a `SHIPPED` order is rejected with stock unchanged

## 3. Storefront — order item product names

- [x] 3.1 Extend `OrderItemView`/`OrderView` in `apps/storefront/app/lib/api-client.ts` with `productName`, `sku`, and variant attributes
- [x] 3.2 Update `apps/storefront/app/orders/[id]/page.tsx` to render product name + attributes instead of the `variantId.slice(0, 8)` pseudo-SKU (keep id slice only as fallback)
- [x] 3.3 Update `apps/storefront/app/order-confirmation/[id]/page.tsx` to show product names for order items
- [x] 3.4 Run `npm run lint --workspace=apps/storefront` and spot-check order detail/confirmation pages against a real order

## 4. Admin — API client

- [x] 4.1 Add `AdminOrder`/`AdminOrderItem`/list-result types and `listOrders`, `getOrder`, `updateOrderStatus`, `cancelOrder` functions to `apps/admin/app/lib/api-client.ts` using the existing session + `x-tenant-slug` fetch wrapper

## 5. Admin — orders pages

- [x] 5.1 Replace the `ComingSoon` placeholder at `apps/admin/app/dashboard/orders/page.tsx` with an order list page: status/payment filter selects, search input, table with short id, date, customer email, status/payment badges, totals, row links to detail, empty/loading states
- [x] 5.2 Create `apps/admin/app/dashboard/orders/[id]/page.tsx` with order summary (status, dates, totals, coupon), customer and shipping blocks, and an items table showing product name, attributes, quantity, unit price, line total
- [x] 5.3 Add detail-page actions: "advance to next status" button shown only when a forward transition exists, and "Cancel order" (with confirm dialog) shown only for `PENDING`/`CONFIRMED`; refresh the displayed status after each action and show API errors inline
- [x] 5.4 Verify unauthenticated access to `/dashboard/orders` and `/dashboard/orders/[id]` redirects to login via the existing dashboard layout guard
- [x] 5.5 Run `npm run lint --workspace=apps/admin` and `npm run build --workspace=apps/admin`; fix any errors

## 6. End-to-end verification

- [ ] 6.1 Full flow: place an order in the storefront → it appears in the admin list → open detail (product names, customer, totals correct) → confirm → ship → deliver, with the storefront detail page reflecting each status change
- [ ] 6.2 Cancel flow: staff cancels a pending order → status shows `CANCELLED`, stock restored, no further status actions offered, storefront shows the cancelled state
- [ ] 6.3 Isolation/roles: a second tenant's admin sees no orders from the first tenant; `STAFF`-role and unauthenticated requests are rejected
