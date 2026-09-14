import type { Tenant } from '@prisma-clients/platform';
import type { PrismaClient as TenantPrismaClient } from '@prisma-clients/tenant';

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
      tenantDb?: TenantPrismaClient;
    }
  }
}

export {};
