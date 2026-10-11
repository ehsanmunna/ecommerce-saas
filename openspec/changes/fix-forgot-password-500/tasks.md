## 1. Platform migration

- [x] 1.1 Add `onModuleInit` to `PlatformPrismaService` that runs `prisma migrate deploy` for the platform schema
- [x] 1.2 Add `migrate:platform` npm script to `apps/api/package.json`

## 2. Error handling

- [x] 2.1 Wrap `AuthService.forgotPassword` in try-catch, return 500 with meaningful message on database error
- [x] 2.2 Wrap `AuthService.resetPassword` in try-catch, return 500 with meaningful message on database error

## 3. Verification

- [x] 3.1 Run `npm run build --workspace=apps/api` and fix any errors
- [x] 3.2 Run `npm run lint --workspace=apps/api` and fix any errors
- [ ] 3.3 Manually verify `POST /auth/forgot-password` returns 200 (not 500) after running platform migration
