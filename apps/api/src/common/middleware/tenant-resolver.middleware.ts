import { Injectable, NestMiddleware, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PlatformPrismaService } from '../../database/platform/platform-prisma.service';
import { TenantConnectionService } from '../../database/tenant/tenant-connection.service';

const DEV_TENANT_SLUG_HEADER = 'x-tenant-slug';

/**
 * Resolves the tenant for every tenant-scoped request from its Host header
 * (or, outside production, an `x-tenant-slug` override header so resolution
 * is testable without real wildcard DNS). Never mounted on platform-level
 * routes such as tenant registration, which have no tenant to resolve yet.
 */
@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(
    private readonly platformPrisma: PlatformPrismaService,
    private readonly tenantConnections: TenantConnectionService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const slug = this.resolveSlug(req);
    if (!slug) {
      throw new NotFoundException('Unable to resolve tenant from request host');
    }

    const tenant = await this.platformPrisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      throw new NotFoundException(`No tenant registered for "${slug}"`);
    }
    if (tenant.status !== 'ACTIVE') {
      throw new ServiceUnavailableException(`Tenant "${slug}" is not currently active (status: ${tenant.status})`);
    }

    req.tenant = tenant;
    req.tenantDb = await this.tenantConnections.getClient(tenant.id, {
      host: tenant.databaseHost,
      port: tenant.databasePort,
      databaseName: tenant.databaseName,
    });

    next();
  }

  private resolveSlug(req: Request): string | null {
    const overrideSlug = req.header(DEV_TENANT_SLUG_HEADER);
    if (overrideSlug && process.env.NODE_ENV !== 'production') {
      return overrideSlug.toLowerCase();
    }

    const host = req.hostname;
    const rootDomain = process.env.APP_ROOT_DOMAIN ?? 'yoursaas.local';
    if (!host.endsWith(`.${rootDomain}`)) {
      return null;
    }
    const subdomain = host.slice(0, -(rootDomain.length + 1));
    if (!subdomain || subdomain.includes('.')) {
      return null;
    }
    return subdomain.toLowerCase();
  }
}
