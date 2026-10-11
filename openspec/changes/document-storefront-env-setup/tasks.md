## 1. README

- [x] 1.1 Add `cp apps/storefront/.env.example apps/storefront/.env.local`
      to the setup steps, alongside the existing `apps/api/.env` and
      `apps/admin/.env.local` lines
- [x] 1.2 Note that `NEXT_PUBLIC_DEV_TENANT_SLUG` must match a tenant
      that's actually been registered, and that `npm run dev:storefront`
      needs restarting after creating or editing the file
