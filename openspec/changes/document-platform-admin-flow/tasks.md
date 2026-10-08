## 1. user-flow.md platform-admin section

- [x] 1.1 Add a platform-admin section covering `POST /platform/auth/login`
      and the `http://localhost:3000/platform/login` page
- [x] 1.2 Document the tenant list (status/plan filters) and tenant
      detail page
- [x] 1.3 Document creating a tenant (invite email, `PENDING_OWNER_SETUP`,
      owner sets password via accept-invite)
- [x] 1.4 Document status actions: suspend, activate, reactivate,
      including the 403 returned to a suspended tenant's API requests
- [x] 1.5 Document repair actions: resend verification, revoke token,
      retry provisioning, invite resend/revoke
- [x] 1.6 Document plan editing

## 2. Known gaps refresh

- [x] 2.1 Update "Known gaps this walkthrough exposes" to reflect the
      removed unauthenticated repair endpoints and the platform-admin
      coverage added above
