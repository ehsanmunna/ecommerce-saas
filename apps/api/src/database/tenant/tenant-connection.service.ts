import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as TenantPrismaClient } from '@prisma-clients/tenant';

export interface TenantConnectionInfo {
  host: string;
  port: number;
  databaseName: string;
}

interface CachedConnection {
  client: TenantPrismaClient;
  lastUsedAt: number;
}

// Bounded so Postgres max_connections isn't exhausted as tenant count grows -
// see design.md's "Bounded, evictable tenant database connections" decision.
const MAX_CACHED_CONNECTIONS = 20;

@Injectable()
export class TenantConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionService.name);
  private readonly cache = new Map<string, CachedConnection>();

  buildConnectionUrl(info: TenantConnectionInfo): string {
    const user = process.env.TENANT_DB_ADMIN_USER;
    const password = process.env.TENANT_DB_ADMIN_PASSWORD;
    return `postgresql://${user}:${password}@${info.host}:${info.port}/${info.databaseName}`;
  }

  async getClient(
    tenantId: string,
    info: TenantConnectionInfo,
  ): Promise<TenantPrismaClient> {
    const cached = this.cache.get(tenantId);
    if (cached) {
      cached.lastUsedAt = Date.now();
      return cached.client;
    }

    if (this.cache.size >= MAX_CACHED_CONNECTIONS) {
      await this.evictLeastRecentlyUsed();
    }

    const client = new TenantPrismaClient({
      datasources: { db: { url: this.buildConnectionUrl(info) } },
    });
    await client.$connect();
    this.cache.set(tenantId, { client, lastUsedAt: Date.now() });
    return client;
  }

  async evict(tenantId: string): Promise<void> {
    const cached = this.cache.get(tenantId);
    if (!cached) return;
    this.cache.delete(tenantId);
    await cached.client.$disconnect();
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    let oldestKey: string | undefined;
    let oldestAt = Infinity;
    for (const [key, value] of this.cache.entries()) {
      if (value.lastUsedAt < oldestAt) {
        oldestAt = value.lastUsedAt;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      this.logger.log(
        `Evicting cached tenant DB connection for tenant ${oldestKey}`,
      );
      await this.evict(oldestKey);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(
      [...this.cache.values()].map((entry) => entry.client.$disconnect()),
    );
    this.cache.clear();
  }
}
