## Purpose

Turns a customer's cart into a real order, with an explicit (currently
stubbed, no real gateway) payment status and a status the customer can
track afterward.

## ADDED Requirements

### Requirement: Place an order from a cart
The system SHALL create an order from a customer's cart given a shipping
address, a delivery method, and a chosen payment method, decrementing
inventory for each item and clearing the cart on success.

#### Scenario: Successful checkout
- **WHEN** a customer checks out a cart with valid shipping address,
  delivery method, and payment method, and every item is still in stock
- **THEN** an order is created, inventory is decremented for each item,
  and the cart is emptied

#### Scenario: Item goes out of stock before checkout
- **WHEN** a customer checks out a cart where one item's stock dropped
  below the cart quantity since it was added
- **THEN** the system rejects the checkout and creates no order, leaving
  inventory and the cart unchanged

### Requirement: Orders carry a stubbed payment status
Every order SHALL carry a payment status. Since no payment gateway is
integrated in this change, placing an order SHALL NOT attempt to charge
any payment method — the order is created with a pending payment status
regardless of the payment method chosen.

#### Scenario: New order's payment status
- **WHEN** an order is successfully placed
- **THEN** its payment status is a pending state, and no external charge
  attempt occurs

### Requirement: Order status lifecycle
An order SHALL move through a defined set of statuses, and a customer
SHALL be able to cancel their own order only while it is in a cancellable
status (before it has shipped).

#### Scenario: Cancelling a pending order
- **WHEN** a customer cancels an order that has not yet shipped
- **THEN** the order's status becomes cancelled and its inventory is
  restored (see the `inventory` capability)

#### Scenario: Cancelling a shipped order is rejected
- **WHEN** a customer attempts to cancel an order that has already shipped
- **THEN** the cancellation is rejected

### Requirement: Order details and tracking
A customer SHALL be able to view the full details and current status of
their own orders, and SHALL NOT be able to view another customer's order.

#### Scenario: Viewing own order
- **WHEN** a customer requests the details of an order they placed
- **THEN** the order's items, shipping information, and current status are
  returned

#### Scenario: Viewing another customer's order
- **WHEN** a customer requests an order id that belongs to a different
  customer
- **THEN** the request is rejected
