## 1. Tenant Schema

- [x] 1.1 Add `Category` model (name, slug, tenant-unique)
- [x] 1.2 Add `Product` model (name, description, price, categoryId,
      isActive, timestamps)
- [x] 1.3 Add `ProductVariant` model (productId, sku, attributes e.g.
      size/color, price override, stock quantity)
- [x] 1.4 Add `Customer` model (email unique per tenant, passwordHash,
      timestamps) - separate from `User`/`Role`
- [x] 1.5 Add `CustomerRefreshToken` model (mirrors staff `RefreshToken`,
      scoped to `Customer`)
- [x] 1.6 Add `CustomerAddress` model (customerId, recipient, line1/2,
      city, region, postalCode, country, isDefault)
- [x] 1.7 Add `Coupon` model (code unique per tenant, discountType
      PERCENTAGE|FIXED, discountValue, expiresAt, isActive)
- [x] 1.8 Add `Cart` model (one open cart per customer) and `CartItem`
      model (cartId, variantId, quantity)
- [x] 1.9 Add `Order` model (customerId, shippingAddress snapshot,
      deliveryMethod, paymentMethod, paymentStatus, status, couponCode,
      subtotal/shipping/total snapshot, timestamps) and `OrderItem`
      (orderId, variantId, quantity, unitPrice snapshot)
- [x] 1.10 Write and apply the tenant DB migration for all of the above

## 2. Product Catalog

- [x] 2.1 Staff-facing: create/update/deactivate a product (`OWNER`/`ADMIN`
      only, via the new `RolesGuard`)
- [x] 2.2 Staff-facing: create/update a category
- [x] 2.3 Staff-facing: create/update a product variant (SKU, price
      override, initial stock)
- [x] 2.4 Storefront-facing: browse/search/filter (category, price
      range)/sort (price, newest)/paginate products - excludes inactive
      products
- [x] 2.5 Storefront-facing: browse categories, list products within a
      category

## 3. Inventory

- [x] 3.1 Implement atomic conditional-decrement stock update (single
      `UPDATE ... WHERE stock >= qty`, per design.md) as a reusable
      service method
- [x] 3.2 Implement stock restoration on order cancellation
- [x] 3.3 Wire decrement into checkout (section 8) inside the same
      transaction as order creation

## 4. Customer Accounts

- [x] 4.1 Implement customer registration (`POST /storefront/auth/register`)
      with per-tenant email uniqueness
- [x] 4.2 Implement customer login issuing an access token signed with
      `JWT_CUSTOMER_ACCESS_SECRET` (separate secret, `type: 'customer'`
      claim per design.md) plus a refresh token
- [x] 4.3 Implement `CustomerJwtStrategy` + `CustomerAuthGuard`, rejecting
      staff tokens (wrong secret/claim) and enforcing the same
      tenant-cross-check pattern as staff auth
- [x] 4.4 Implement customer refresh-token exchange and revocation
      (mirrors staff `auth.service.ts`)
- [x] 4.5 Implement `GET/PATCH /storefront/me` (view/update own profile)
- [x] 4.6 Implement saved addresses (`POST`/`DELETE
      /storefront/me/addresses`)
- [x] 4.7 Implement `RolesGuard` for staff-only routes (`OWNER`/`ADMIN`),
      used by catalog and coupon management

## 5. Shopping Cart

- [x] 5.1 Implement get-or-create the customer's open cart
- [x] 5.2 Implement add item to cart (reject if requested quantity exceeds
      current stock)
- [x] 5.3 Implement update item quantity (same stock-bound validation)
- [x] 5.4 Implement remove item from cart
- [x] 5.5 Implement coupon application (validate code, active, not
      expired) and coupon removal from a cart
- [x] 5.6 Implement computed subtotal/shipping/total on the cart response
- [x] 5.7 Staff-facing: create/list/deactivate a coupon (`OWNER`/`ADMIN`
      only)

## 6. Checkout & Orders

- [x] 6.1 Implement checkout: validate stock for every cart item,
      atomically decrement inventory (section 3), create the order +
      order items, clear the cart - all in one transaction
- [x] 6.2 Reject checkout when any item's stock is insufficient, leaving
      inventory and the cart unchanged
- [x] 6.3 Set every new order's payment status to a pending state; no
      external payment call is made (per design.md's stubbed-payment
      decision)
- [x] 6.4 Implement order status transitions and cancellation (only
      before shipped), restoring inventory on cancellation
- [x] 6.5 Implement `GET /storefront/orders` (own orders) and
      `GET /storefront/orders/:id` (own order detail/tracking), rejecting
      access to another customer's order

## 7. Wiring

- [x] 7.1 Extend `TenantResolverMiddleware`'s `forRoutes(...)` to cover
      every new controller (customer auth, storefront `/me`, catalog,
      cart, orders) per design.md
- [x] 7.2 Add `JWT_CUSTOMER_ACCESS_SECRET` (and any delivery-fee config)
      to `apps/api/.env.example`

## 8. Verification

- [x] 8.1 Test: browsing/searching/filtering/sorting/paginating products
      returns expected results and excludes inactive products
- [x] 8.2 Test: a customer token is rejected on a staff-only route and a
      staff token is rejected on a customer-only route
- [x] 8.3 Test: a customer of tenant A cannot use their token against
      tenant B
- [x] 8.4 Test: adding/updating a cart item beyond available stock is
      rejected; valid changes recompute totals correctly
- [x] 8.5 Test: applying a valid coupon reduces the total; an
      invalid/expired coupon is rejected
- [x] 8.6 Test: two concurrent checkouts for the last unit of a variant -
      exactly one succeeds, stock never goes negative
- [x] 8.7 Test: successful checkout creates an order, decrements stock,
      and empties the cart; a checkout with an out-of-stock item creates
      no order and changes nothing
- [x] 8.8 Test: cancelling a pending order restores stock; cancelling a
      shipped order is rejected (also verified: a staff-only status
      endpoint added mid-implementation to make "shipped" reachable at
      all - see below)
- [x] 8.9 Test: a customer cannot view another customer's order or profile
