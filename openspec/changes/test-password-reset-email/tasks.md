## 1. E2E test setup

- [x] 1.1 Create `apps/api/test/password-reset.e2e-spec.ts` with test module setup (reuse existing e2e test infrastructure)
- [x] 1.2 Add helper to create test users (staff, customer, platform admin) and clean up after each test

## 2. Staff password reset tests

- [x] 2.1 Test: staff forgot-password generates token and returns 200
- [x] 2.2 Test: staff reset-password with valid token succeeds
- [x] 2.3 Test: staff reset-password with expired token returns 400
- [x] 2.4 Test: staff reset-password with reused token returns 400

## 3. Customer password reset tests

- [x] 3.1 Test: customer forgot-password generates token and returns 200
- [x] 3.2 Test: customer reset-password with valid token succeeds

## 4. Platform admin password reset tests

- [x] 4.1 Test: platform admin forgot-password generates token and returns 200
- [x] 4.2 Test: platform admin reset-password with valid token succeeds

## 5. Rate limiting test

- [x] 5.1 Test: rapid successive forgot-password requests return 429

## 6. Verification

- [ ] 6.1 Run `npm run test:e2e --workspace=apps/api` and fix any failures
