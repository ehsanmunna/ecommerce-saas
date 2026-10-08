## Context

See proposal.md - Why. Tenant `Product` currently: name, description, price, categoryId, isActive, timestamps. This change replaces `price`/`isActive` with the richer field set requested for the admin product form. Storefront browse and staff list both project Product fields, and `admin` pages read `price`/`isActive`.

## Goals / Non-Goals

**Goals:**
- Tenant schema migration adding the 10 product fields; backfill existing rows.
- Catalog API DTOs/service support the new fields on list/create/update.
- Admin create/edit forms collect all fields; products table shows status.

**Non-Goals:**
- Image upload pipeline — `mainImage` is a URL string input for now.
- Inventory module integration — `stockQuantity` is a plain counter on Product, not wired to stock movements.
- Variant-level pricing rework — variants keep their own `priceOverride`.

## Decisions

- **Replace `price` with `regularPrice`, `isActive` with `status`**: a single active boolean can't express draft/archived; `regularPrice` + `salePrice` matches the requested pricing model. Storefront active check becomes `status = 'active'`, price filter/sort uses `regularPrice`.
- **`status` as string enum ('active'/'draft'/'archived')** rather than a Prisma enum: keeps migrations simple across tenant DBs and avoids enum migration friction; validated in DTO.
- **`sku` unique on Product** in addition to variant sku: product-level sku is the simple selling unit identifier requested.
- **Migration backfill** maps `price → regularPrice`, `isActive → status`, defaults others.

## Risks / Trade-offs

- [Risk] Any unpinned reader of `product.price`/`isActive` (storefront app, seed scripts) breaks → Mitigation: grep and update all usages in this change.
- [Risk] Tenant migration across many tenant DBs → run via existing tenant DB provisioning path; not automating rollback.
