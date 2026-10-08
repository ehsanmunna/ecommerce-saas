## Purpose

Lets a logged-in customer collect items before checkout, see accurate
totals as the cart changes, and apply a coupon code.

## ADDED Requirements

### Requirement: Cart belongs to one customer
Every cart SHALL belong to exactly one customer, and only that customer
SHALL be able to view or modify it.

#### Scenario: Accessing another customer's cart
- **WHEN** a customer attempts to view or modify a cart that belongs to a
  different customer
- **THEN** the request is rejected

### Requirement: Add item to cart
The system SHALL allow adding an in-stock product/variant to the cart, and
SHALL reject adding a quantity greater than what is currently in stock.

#### Scenario: Adding an in-stock item
- **WHEN** a customer adds an available product/variant to their cart
- **THEN** the item appears in the cart with the requested quantity

#### Scenario: Adding more than available stock
- **WHEN** a customer attempts to add a quantity greater than the current
  stock for that product/variant
- **THEN** the request is rejected

### Requirement: Update item quantity
The system SHALL allow updating a cart item's quantity to any value from 1
up to the current available stock, and SHALL reject a requested quantity
beyond that.

#### Scenario: Valid quantity update
- **WHEN** a customer updates a cart item to a quantity within available
  stock
- **THEN** the cart reflects the new quantity and recalculated totals

### Requirement: Remove item from cart
The system SHALL allow removing an item from the cart, after which it no
longer contributes to the cart's totals.

#### Scenario: Removing an item
- **WHEN** a customer removes an item from their cart
- **THEN** that item is gone and the cart total no longer includes it

### Requirement: Apply a coupon code
The system SHALL allow applying a valid, unexpired coupon code to reduce
the cart total per that coupon's discount rule, and SHALL reject an
invalid or expired coupon code.

#### Scenario: Valid coupon applied
- **WHEN** a customer applies a valid, unexpired coupon code
- **THEN** the cart total reflects that coupon's discount

#### Scenario: Invalid or expired coupon
- **WHEN** a customer applies a coupon code that does not exist or has
  expired
- **THEN** the system rejects the coupon and the cart total is unchanged

### Requirement: Cart totals
The cart SHALL expose a subtotal (sum of item prices × quantities), a
shipping estimate, and a total (subtotal + shipping − any coupon
discount) that stays consistent with the cart's current contents.

#### Scenario: Totals reflect current cart state
- **WHEN** a customer views their cart after adding items and applying a
  coupon
- **THEN** the subtotal, shipping, and total shown reflect exactly those
  items and that coupon
