## Purpose

Tracks how much stock each product/variant has, so the store never sells
more than it actually has available.

## ADDED Requirements

### Requirement: Track stock per product/variant
The system SHALL track a stock quantity for every purchasable
product/variant.

#### Scenario: Viewing current stock
- **WHEN** a tenant checks stock for a product/variant
- **THEN** the current available quantity is returned

### Requirement: Decrement stock on order placement
When an order is placed, the system SHALL decrement the stock of each
ordered product/variant by the ordered quantity.

#### Scenario: Placing an order reduces stock
- **WHEN** an order for 2 units of a variant is placed successfully
- **THEN** that variant's stock decreases by exactly 2

### Requirement: Prevent overselling
The system SHALL NOT allow stock for any product/variant to go below
zero, even under concurrent order attempts for the same item.

#### Scenario: Ordering more than available stock
- **WHEN** a customer attempts to order more units of a variant than are
  currently in stock
- **THEN** the system rejects the order without decrementing stock

#### Scenario: Concurrent orders for the last unit
- **WHEN** two checkout attempts for the same single remaining unit of a
  variant happen at the same time
- **THEN** exactly one attempt succeeds and the other is rejected as
  out-of-stock — stock never goes negative

### Requirement: Cancelling an order restores stock
When an order is cancelled, the system SHALL restore the stock quantity
that order had decremented.

#### Scenario: Cancelling a pending order
- **WHEN** a pending order for 2 units of a variant is cancelled
- **THEN** that variant's stock increases by 2
