import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PlatformPrismaService } from '../../database/platform/platform-prisma.service';
import { TenantConnectionService } from '../../database/tenant/tenant-connection.service';
import { TenantDatabaseAdminService } from '../../database/tenant/tenant-database-admin.service';
import { TenantMigrationService } from '../../database/tenant/tenant-migration.service';
import type { PrismaClient as TenantPrismaClient } from '@prisma-clients/tenant';

const DEFAULT_ROLES = ['OWNER', 'ADMIN', 'STAFF'];

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(
    private readonly platformPrisma: PlatformPrismaService,
    private readonly dbAdmin: TenantDatabaseAdminService,
    private readonly migrations: TenantMigrationService,
    private readonly connections: TenantConnectionService,
  ) {}

  /**
   * Creates the tenant database, migrates it, seeds defaults, and creates
   * the owner account. Any failure past database creation is compensated
   * (drop the database) and the tenant is left PROVISIONING_FAILED rather
   * than ACTIVE - see design.md's provisioning-failure decision.
   */
  async provision(tenantId: string): Promise<void> {
    const tenant = await this.platformPrisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

    if (!tenant.ownerEmail || !tenant.ownerPasswordHash) {
      throw new BadRequestException('Tenant is missing owner credentials required for provisioning');
    }

    try {
      await this.dbAdmin.createDatabase(tenant.databaseName);

      const connectionUrl = this.connections.buildConnectionUrl({
        host: tenant.databaseHost,
        port: tenant.databasePort,
        databaseName: tenant.databaseName,
      });
      await this.migrations.deploy(connectionUrl);

      const client = await this.connections.getClient(tenant.id, {
        host: tenant.databaseHost,
        port: tenant.databasePort,
        databaseName: tenant.databaseName,
      });
      await this.seedDefaults(client, tenant.name, tenant.ownerEmail, tenant.ownerPasswordHash);

      await this.platformPrisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'ACTIVE', ownerEmail: null, ownerPasswordHash: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Provisioning failed for tenant "${tenant.slug}": ${message}`);

      await this.connections.evict(tenant.id);
      try {
        await this.dbAdmin.dropDatabaseIfExists(tenant.databaseName);
      } catch (cleanupError) {
        const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        this.logger.error(`Cleanup of database "${tenant.databaseName}" failed: ${cleanupMessage}`);
      }

      await this.platformPrisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'PROVISIONING_FAILED' },
      });
    }
  }

  /**
   * Retries a failed provisioning attempt. Cleans up any partial resources
   * first so retrying never leaves orphaned databases or duplicate tenants.
   */
  async retry(tenantId: string): Promise<void> {
    const tenant = await this.platformPrisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    if (tenant.status !== 'PROVISIONING_FAILED') {
      throw new BadRequestException('Only tenants in PROVISIONING_FAILED status can be retried');
    }

    await this.connections.evict(tenant.id);
    await this.dbAdmin.dropDatabaseIfExists(tenant.databaseName);
    await this.platformPrisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'PROVISIONING' },
    });

    await this.provision(tenantId);
  }

  private async seedDefaults(
    client: TenantPrismaClient,
    tenantName: string,
    ownerEmail: string,
    ownerPasswordHash: string,
  ): Promise<void> {
    const roles = await Promise.all(DEFAULT_ROLES.map((name) => client.role.create({ data: { name } })));
    const ownerRole = roles.find((role) => role.name === 'OWNER');
    if (!ownerRole) {
      throw new Error('OWNER role was not created during seeding');
    }

    await client.settings.create({ data: { storeName: tenantName } });
    await client.theme.create({ data: {} });
    await client.user.create({
      data: {
        email: ownerEmail,
        passwordHash: ownerPasswordHash,
        roleId: ownerRole.id,
      },
    });
  }
}
