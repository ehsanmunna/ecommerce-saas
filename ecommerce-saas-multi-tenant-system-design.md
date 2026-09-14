# SaaS Product for Ecommerce — Multi-Tenant System Design

## 1. Overview

This document describes a recommended architecture for a multi-tenant ecommerce SaaS platform.

### Example tenants

- **Anaysha** → Tenant A → Database A
- **Isadi** → Tenant B → Database B

The core principle is:

> **One shared application/codebase, with a separate database for each tenant.**

Each tenant can customize its own branding, including:

- Logo
- Favicon
- Primary color
- Secondary color
- Theme
- Store information
- Custom domain

---

## 2. Recommended Technology Stack

| Layer | Recommended Technology |
|---|---|
| Customer Storefront | Next.js / React |
| Admin Dashboard | React / Next.js |
| Backend | NestJS |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache | Redis |
| Queue | RabbitMQ |
| Object Storage | S3 / Cloudflare R2 |
| DNS/CDN | Cloudflare |
| Authentication | JWT + Refresh Token |
| Containerization | Docker |
| CI/CD | GitHub Actions |
| Monitoring | Sentry + OpenTelemetry |
| Deployment | AWS / Azure / Render initially |

For the first version, avoid unnecessary infrastructure complexity. Start with a manageable deployment and scale as the number of tenants grows.

---

# 3. High-Level System Architecture

```text
                         Internet
                            │
                    ┌───────▼────────┐
                    │   DNS / CDN     │
                    │   Cloudflare    │
                    └───────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
      anaysha.com                    isadi.com
              │                           │
              └─────────────┬─────────────┘
                            │
                    ┌───────▼────────┐
                    │ SaaS Frontend  │
                    │ React / Next.js│
                    └───────┬────────┘
                            │
                       HTTPS / API
                            │
                    ┌───────▼────────┐
                    │  API Gateway   │
                    │ / Load Balancer│
                    └───────┬────────┘
                            │
                 ┌──────────▼──────────┐
                 │    SaaS Backend     │
                 │       NestJS        │
                 │                     │
                 │ Tenant Resolver     │
                 │ Auth                │
                 │ Products            │
                 │ Orders              │
                 │ Customers           │
                 │ Settings            │
                 └──────────┬──────────┘
                            │
                  Tenant Database Resolver
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
    │ Anaysha DB│     │  Isadi DB  │     │ Tenant C  │
    │ PostgreSQL│     │ PostgreSQL │     │ PostgreSQL│
    └───────────┘     └────────────┘     └───────────┘
```

---

# 4. Tenant Architecture

The platform contains a central Platform Database and individual Tenant Databases.

```text
                   SaaS Platform
                        │
                 ┌──────▼──────┐
                 │ Tenant DB   │
                 │  Registry   │
                 └──────┬──────┘
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
     Anaysha          Isadi          AnotherShop
        │               │                │
        ▼               ▼                ▼
   anaysha_db        isadi_db       another_db
```

### Architecture principle

> **Platform DB = information about SaaS tenants.**

> **Tenant DB = ecommerce/business data belonging to one tenant.**

---

# 5. Platform Database

The Platform Database stores tenant and SaaS-level information.

Example:

```text
platform_db
│
├── tenants
├── plans
├── subscriptions
├── billing
├── domains
└── platform_users
```

### tenants

```text
tenants
├── id
├── name
├── slug
├── database_name
├── database_host
├── database_port
├── status
├── plan_id
├── created_at
└── updated_at
```

Example:

```text
id: 1
name: Anaysha
slug: anaysha
database_name: ecommerce_anaysha
status: ACTIVE
plan: PRO
```

Another tenant:

```text
id: 2
name: Isadi
slug: isadi
database_name: ecommerce_isadi
status: ACTIVE
plan: BASIC
```

---

# 6. Tenant Database Design

Every tenant receives the same database structure, but the data is isolated.

Example:

```text
ecommerce_anaysha
│
├── users
├── roles
├── permissions
├── products
├── categories
├── brands
├── inventory
├── customers
├── carts
├── orders
├── order_items
├── payments
├── shipping
├── coupons
├── reviews
├── settings
├── themes
└── audit_logs
```

Isadi receives the same schema:

```text
ecommerce_isadi
│
├── users
├── roles
├── permissions
├── products
├── categories
├── brands
├── inventory
├── customers
├── carts
├── orders
├── order_items
├── payments
├── shipping
├── coupons
├── reviews
├── settings
├── themes
└── audit_logs
```

The schema is shared as a template, but the business data is completely separate.

---

# 7. Why Database-per-Tenant?

For this ecommerce SaaS, database-per-tenant provides strong isolation.

### Benefits

#### Security

Tenant data is physically separated at the database level.

#### Backup

Each tenant can have an independent backup.

```text
backup/
├── anaysha/
│   └── 2026-09-13.sql
└── isadi/
    └── 2026-09-13.sql
```

#### Restore

A single tenant can be restored without restoring the entire SaaS platform.

#### Migration

A large tenant can later be moved to another database server.

#### Enterprise plans

You can eventually offer:

```text
Basic
→ shared infrastructure

Pro
→ dedicated database

Enterprise
→ dedicated database server / infrastructure
```

---

# 8. Tenant Registration Flow

When a company registers:

```text
                Company
                   │
                   ▼
          Registration Page
                   │
                   ▼
       Company information
                   │
                   ▼
        Create tenant record
                   │
                   ▼
          Generate tenant ID
                   │
                   ▼
       Create PostgreSQL DB
                   │
                   ▼
        Run Prisma migrations
                   │
                   ▼
        Create admin account
                   │
                   ▼
        Create default settings
                   │
                   ▼
        Create default theme
                   │
                   ▼
           Tenant activated
                   │
                   ▼
          Store is ready
```

---

# 9. Tenant Identification

A request must be mapped to the correct tenant.

Example:

```text
https://anaysha.com
        │
        ▼
Tenant Resolver
        │
        ▼
Anaysha
        │
        ▼
tenant_id = 123
        │
        ▼
ecommerce_anaysha
```

Another tenant:

```text
https://isadi.com
        │
        ▼
Tenant Resolver
        │
        ▼
Isadi
        │
        ▼
tenant_id = 456
        │
        ▼
ecommerce_isadi
```

The tenant can be resolved using:

1. Custom domain
2. SaaS subdomain
3. Authenticated user's tenant membership

The recommended production approach is to support both subdomains and custom domains.

---

# 10. Domain and Subdomain Strategy

Recommended structure:

```text
                         yoursaas.com
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
       app.yoursaas.com  api.yoursaas.com  www.yoursaas.com
            │
            ▼
       Tenant storefronts
            │
       ┌────┴────┐
       ▼         ▼
anaysha.yoursaas.com
isadi.yoursaas.com
```

### SaaS application

```text
app.yoursaas.com
```

Used for:

- SaaS registration
- Login
- Tenant admin dashboard
- Billing
- SaaS account management

### API

```text
api.yoursaas.com
```

Used by frontend applications.

### Tenant storefronts

```text
anaysha.yoursaas.com
isadi.yoursaas.com
```

These are the default storefront URLs.

---

# 11. Custom Domain Strategy

A tenant can optionally connect its own domain.

Example:

```text
www.anaysha.com
        │
        ▼
anaysha.yoursaas.com
        │
        ▼
Same SaaS application
        │
        ▼
Anaysha Tenant
```

Tenant settings:

```text
Settings
└── Domain
    ├── Default domain
    │   └── anaysha.yoursaas.com
    │
    └── Custom domain
        └── www.anaysha.com
```

The tenant can be instructed to configure:

```text
CNAME

www → anaysha.yoursaas.com
```

Cloudflare can provide DNS management, CDN, and SSL.

---

# 12. Domain Database Table

The platform database can contain:

```text
domains
├── id
├── tenant_id
├── domain
├── is_primary
├── verified
├── verification_token
├── created_at
└── updated_at
```

Example:

```text
tenant_id: 123
domain: www.anaysha.com
is_primary: true
verified: true
```

---

# 13. Branding and Customization

Tenant settings should be stored in the tenant database.

Example:

```text
settings
├── logo_url
├── favicon_url
├── primary_color
├── secondary_color
├── font_family
├── currency
├── language
├── timezone
├── store_name
└── contact_email
```

Example Anaysha configuration:

```json
{
  "logo": "/logos/anaysha.png",
  "primaryColor": "#7B2CBF",
  "secondaryColor": "#F72585"
}
```

Example Isadi configuration:

```json
{
  "logo": "/logos/isadi.png",
  "primaryColor": "#0077B6",
  "secondaryColor": "#90E0EF"
}
```

The frontend remains the same application.

Only configuration changes.

---

# 14. Frontend Architecture

Do NOT create separate frontend applications for every tenant.

Bad:

```text
AnayshaFrontend
IsadiFrontend
ClientCFrontend
```

Recommended:

```text
                    React / Next.js App
                           │
                    Tenant Resolver
                           │
             ┌─────────────┴─────────────┐
             │                           │
          Anaysha                       Isadi
             │                           │
             ▼                           ▼
          Theme A                      Theme B
          Logo A                       Logo B
          Config A                     Config B
```

Reusable components:

```text
components/
├── Header
├── Footer
├── ProductCard
├── ProductGrid
├── Cart
├── Checkout
└── Button
```

Tenant configuration controls appearance and branding.

---

# 15. Backend Architecture

Recommended NestJS structure:

```text
src/
│
├── modules/
│   ├── auth/
│   ├── tenant/
│   ├── users/
│   ├── products/
│   ├── categories/
│   ├── orders/
│   ├── customers/
│   ├── inventory/
│   ├── payments/
│   ├── shipping/
│   └── settings/
│
├── common/
│   ├── guards/
│   ├── interceptors/
│   ├── decorators/
│   ├── filters/
│   └── middleware/
│
├── database/
│   ├── platform/
│   └── tenant/
│
├── infrastructure/
│   ├── redis/
│   ├── rabbitmq/
│   ├── storage/
│   └── email/
│
└── main.ts
```

---

# 16. Tenant Resolver

The Tenant Resolver is one of the most important components.

Example request:

```http
GET /products
Host: anaysha.yoursaas.com
```

Processing:

```text
Host
 ↓
anaysha.yoursaas.com
 ↓
TenantResolver
 ↓
tenant = Anaysha
 ↓
database = ecommerce_anaysha
 ↓
ProductService
 ↓
Anaysha products
```

Another request:

```http
GET /products
Host: isadi.yoursaas.com
```

Processing:

```text
isadi.yoursaas.com
 ↓
TenantResolver
 ↓
tenant = Isadi
 ↓
database = ecommerce_isadi
 ↓
ProductService
 ↓
Isadi products
```

---

# 17. User Flow — SaaS Registration

```text
Landing Page
     │
     ▼
Register
     │
     ▼
Company Information
     │
     ▼
Choose Plan
     │
     ▼
Payment
     │
     ▼
Create Tenant
     │
     ▼
Create Tenant Database
     │
     ▼
Initialize Database
     │
     ▼
Create Owner Account
     │
     ▼
Create Default Configuration
     │
     ▼
Dashboard
```

---

# 18. User Flow — Tenant Admin

```text
Login
  │
  ▼
Tenant Dashboard
  │
  ├── Products
  ├── Categories
  ├── Orders
  ├── Customers
  ├── Inventory
  ├── Reports
  │
  └── Settings
        │
        ├── Logo
        ├── Theme
        ├── Store Information
        ├── Domain
        ├── Payment
        └── Shipping
```

---

# 19. Database Provisioning Flow

When a new tenant registers:

```text
POST /tenants/register
        │
        ▼
Validate Company
        │
        ▼
Create Tenant in platform_db
        │
        ▼
Generate Database Name
        │
        ▼
Create PostgreSQL Database
        │
        ▼
Run Prisma Migration
        │
        ▼
Seed Default Roles
        │
        ▼
Create Owner
        │
        ▼
Create Default Settings
        │
        ▼
Create Default Theme
        │
        ▼
Mark Tenant ACTIVE
```

As the platform grows, move provisioning to an asynchronous worker:

```text
Registration
     │
     ▼
Tenant Provisioning Job
     │
     ▼
RabbitMQ
     │
     ▼
Worker
     │
     ├── Create DB
     ├── Run Migration
     ├── Seed Data
     └── Configure Tenant
```

---

# 20. Git / Version Control Strategy

Use one monorepo initially.

```text
ecommerce-saas/
│
├── apps/
│   ├── storefront/
│   ├── admin/
│   └── api/
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── config/
│   └── utils/
│
├── prisma/
│
├── infrastructure/
│   ├── docker/
│   └── terraform/
│
├── docs/
│
├── .github/
│   └── workflows/
│
└── README.md
```

Recommended branches:

```text
main
develop
feature/*
bugfix/*
hotfix/*
```

Examples:

```text
feature/tenant-registration
feature/custom-domain
feature/theme-management
feature/product-management
```

Avoid tenant-specific branches such as:

```text
anaysha-feature
isadi-feature
```

Tenants are data/configuration, not separate codebases.

---

# 21. Application Versioning

The SaaS should have one application version.

Example:

```text
SaaS v1.4.0
```

Not:

```text
Anaysha v1.0
Isadi v1.0
```

Both tenants run the same application version.

---

# 22. Database Migration Versioning

Prisma migrations should be stored in source control.

Example:

```text
migration/
├── 001_initial
├── 002_add_inventory
├── 003_add_coupon
├── 004_add_theme
└── 005_add_shipping
```

When releasing:

```text
v1.4.0
```

the migration must be applied to every tenant database.

This requires an automated migration process as the tenant count grows.

---

# 23. DevOps Flow

Recommended CI/CD flow:

```text
Developer
    │
    ▼
Git Push
    │
    ▼
GitHub
    │
    ▼
Pull Request
    │
    ▼
Code Review
    │
    ▼
CI
 ┌──┴───────────────┐
 │                  │
Test              Build
 │                  │
Lint              Docker
 │                  │
Security          Image
 └───────┬──────────┘
         │
         ▼
       Merge
         │
         ▼
       main
         │
         ▼
   GitHub Actions
         │
         ▼
    Docker Image
         │
         ▼
 Container Registry
         │
         ▼
      Deploy
         │
    ┌────┴────┐
    ▼         ▼
 Staging   Production
```

---

# 24. Environment Strategy

Use three environments:

```text
Development
     ↓
Staging
     ↓
Production
```

Suggested domains:

```text
dev.yoursaas.com
staging.yoursaas.com
app.yoursaas.com
```

Example staging tenants:

```text
anaysha.staging.yoursaas.com
isadi.staging.yoursaas.com
```

---

# 25. Production Infrastructure

Initial deployment:

```text
Cloudflare
    │
    ▼
Load Balancer
    │
    ▼
Docker
 ┌──┴─────────┐
 │            │
API         Frontend
 │
 ├── PostgreSQL
 ├── Redis
 ├── RabbitMQ
 └── Object Storage
```

As the platform grows:

```text
Cloudflare
     │
     ▼
Load Balancer
     │
     ▼
Container Platform / Kubernetes
     │
 ┌───┼──────────┐
 │   │          │
API API       Workers
 │
 ├── PostgreSQL Cluster
 │      │
 │      ├── Tenant DB A
 │      ├── Tenant DB B
 │      ├── Tenant DB C
 │      └── Tenant DB N
 │
 ├── Redis
 ├── RabbitMQ
 └── Object Storage
```

Kubernetes is not required for the first release.

---

# 26. Security Architecture

Every request should go through:

```text
Request
   ↓
Authentication
   ↓
Tenant Resolution
   ↓
Authorization
   ↓
Tenant DB Connection
   ↓
Business Logic
```

Do not allow tenant selection to be determined only from arbitrary user input.

For example, avoid trusting:

```http
GET /tenant/123/products
```

as the sole source of tenant identity.

Instead combine:

```text
Authenticated User
+
Tenant Membership
+
Resolved Domain
```

Example JWT:

```json
{
  "userId": "user-123",
  "tenantId": "tenant-456",
  "role": "ADMIN"
}
```

Then verify:

```text
JWT tenantId
      =
Resolved domain tenantId
```

---

# 27. File and Image Storage

Do not store tenant product images on the application server.

Use object storage.

Recommended structure:

```text
Object Storage
│
└── tenants/
    ├── anaysha/
    │   ├── logo/
    │   ├── products/
    │   └── banners/
    │
    └── isadi/
        ├── logo/
        ├── products/
        └── banners/
```

Possible providers:

- Amazon S3
- Cloudflare R2
- Azure Blob Storage

---

# 28. Complete Architecture

```text
                         INTERNET
                            │
                     ┌──────▼──────┐
                     │  Cloudflare │
                     │ DNS / CDN   │
                     └──────┬──────┘
                            │
            ┌───────────────┼────────────────┐
            │               │                │
            ▼               ▼                ▼
       anaysha.com      isadi.com       yoursaas.com
            │               │                │
            └───────────────┼────────────────┘
                            │
                    ┌───────▼────────┐
                    │    Frontend    │
                    │ React / Next.js│
                    └───────┬────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ API / Gateway │
                    └───────┬───────┘
                            │
                    ┌───────▼────────┐
                    │    NestJS      │
                    │                │
                    │ Auth           │
                    │ Tenant Resolver│
                    │ Products       │
                    │ Orders         │
                    │ Customers      │
                    │ Settings       │
                    └───────┬────────┘
                            │
             ┌──────────────┴───────────────┐
             │                              │
             ▼                              ▼
      ┌──────────────┐               ┌──────────────┐
      │ Platform DB  │               │ Tenant DBs   │
      │              │               │              │
      │ tenants      │               │ Anaysha DB   │
      │ plans        │               │ Isadi DB     │
      │ billing      │               │ Client N DB  │
      │ domains      │               │              │
      └──────────────┘               └──────────────┘
                                             │
                            ┌────────────────┼──────────────┐
                            │                │              │
                            ▼                ▼              ▼
                          Redis          RabbitMQ       Storage
```

---

# 29. Recommended Implementation Phases

## Phase 1 — SaaS Foundation

Build:

```text
Tenant registration
Tenant database provisioning
Tenant resolver
Authentication
Basic dashboard
```

## Phase 2 — Ecommerce

Build:

```text
Products
Categories
Customers
Cart
Orders
Inventory
```

## Phase 3 — Customization

Build:

```text
Logo
Favicon
Primary color
Secondary color
Theme
Store information
```

## Phase 4 — Domains

Build:

```text
tenant.yoursaas.com
custom-domain.com
DNS verification
SSL
```

## Phase 5 — SaaS Management

Build:

```text
Plans
Subscriptions
Billing
Usage limits
Tenant suspension
Tenant deletion
```

## Phase 6 — Production DevOps

Build:

```text
Docker
CI/CD
Staging
Production
Monitoring
Logging
Backups
Database migration automation
```

---

# 30. Database Architecture Decision

There are three common SaaS database models.

### A. Shared Database

```text
database
│
├── users
├── products
└── orders

Every table contains:
tenant_id
```

### B. Shared Database Server + Separate Schemas

```text
PostgreSQL
│
├── tenant_a schema
├── tenant_b schema
└── tenant_c schema
```

### C. Database per Tenant

```text
PostgreSQL
│
├── tenant_a_db
├── tenant_b_db
└── tenant_c_db
```

### Recommended for this project

> **C — Database-per-tenant**

while maintaining:

> **One shared application/codebase.**

---

# 31. Final Architecture Principle

The entire SaaS can be summarized as:

```text
                     ONE CODEBASE
                          │
             ┌────────────┴────────────┐
             │                         │
          TENANT A                  TENANT B
             │                         │
       DB-A + Config-A           DB-B + Config-B
             │                         │
       anaysha.com               isadi.com
```

This approach provides:

- Tenant isolation
- Shared application development
- Independent tenant backups
- Independent tenant restore
- Custom branding
- Custom domains
- Scalable ecommerce architecture
- Easier enterprise-level database isolation
- A clean foundation for SaaS subscriptions and billing

---

# 32. Next Implementation Blueprint

The next technical design should convert this architecture into implementation-level specifications:

1. PostgreSQL ERD
2. Platform DB tables
3. Tenant DB tables
4. Prisma multi-database architecture
5. NestJS tenant resolver
6. JWT authentication and tenant authorization
7. React/Next.js tenant detection
8. Dynamic theme system
9. Tenant database provisioning service
10. Database migration strategy
11. Docker Compose
12. GitHub Actions CI/CD
13. Cloudflare DNS configuration
14. Custom-domain verification
15. Production deployment architecture
16. Backup and disaster recovery strategy

---

# 33. Customer Storefront Page Inventory

The customer-facing storefront (the shared React/Next.js frontend described
in section 14) is organized around the following pages. This is a
content/sitemap reference for Phase 2 (Ecommerce) and later phases — it
does not itself change the architecture.

### Home

```text
Hero/banner
Featured products
Categories
Best sellers
Promotions
```

### Shop / Products

```text
Product grid
Search
Filter
Sort
Pagination/infinite scroll
```

### Category

```text
Example: Electronics, Clothing, Cosmetics
Category-specific filters
```

### Product Details

```text
Images
Price
Variants (size/color)
Quantity
Add to Cart
Buy Now
Reviews
```

### Shopping Cart

```text
Cart items
Quantity update
Remove item
Coupon
Subtotal
Shipping
Total
Checkout button
```

### Checkout

```text
Customer information
Shipping address
Delivery method
Payment method
Order summary
Place Order
```

### Order Confirmation

```text
Order number
Order summary
Payment status
Delivery information
```

### My Account

```text
Profile
Addresses
Orders
Wishlist
Password/security
```

### Order Details / Tracking

```text
Order status
Products
Shipping information
Tracking
```

### Wishlist

```text
Saved products
Add to cart
Remove
```

### Important Supporting Pages

```text
Login
Register
Forgot Password
About Us
Contact Us
FAQ
Privacy Policy
Terms & Conditions
Shipping & Delivery Policy
Return & Refund Policy
```
