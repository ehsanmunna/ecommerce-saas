## ADDED Requirements

### Requirement: Order items identify products by name
Order detail responses returned to customers and staff SHALL identify each order item by its product name — including the variant's attribute summary (e.g. size, color) when present — instead of exposing only an opaque variant id, and both the storefront and admin order views SHALL render that name.

#### Scenario: Customer views their order items
- **WHEN** a customer opens the details of their own order
- **THEN** each line item is labeled with the product name (and variant attributes where applicable), not a raw variant UUID

#### Scenario: Staff views order items
- **WHEN** a staff member opens an order in the admin dashboard
- **THEN** each line item shows the product name and quantity alongside its unit price

#### Scenario: Product no longer resolves
- **WHEN** an order item's underlying product can no longer be resolved
- **THEN** the item is still displayed using a fallback identifier derived from its SKU or variant id, and the order detail remains fully viewable
