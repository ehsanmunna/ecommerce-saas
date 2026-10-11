import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PlatformPrismaService } from '../../database/platform/platform-prisma.service';
import { TenantConnectionService } from '../../database/tenant/tenant-connection.service';
import { TenantDatabaseAdminService } from '../../database/tenant/tenant-database-admin.service';
import { TenantMigrationService } from '../../database/tenant/tenant-migration.service';
import { TenantProvisioningService } from './tenant-provisioning.service';

const baseTenant = {
  id: 'tenant-1',
  slug: 'acme',
  name: 'Acme Inc',
  databaseName: 'tenant_acme',
  databaseHost: 'localhost',
  databasePort: 55432,
  status: 'PROVISIONING',
  ownerEmail: 'owner@acme.test',
  ownerPasswordHash: 'hashed',
};

describe('TenantProvisioningService', () => {
  let service: TenantProvisioningService;
  let platformPrisma: {
    tenant: { findUniqueOrThrow: jest.Mock; update: jest.Mock };
  };
  let dbAdmin: { createDatabase: jest.Mock; dropDatabaseIfExists: jest.Mock };
  let migrations: { deploy: jest.Mock };
  let connections: {
    buildConnectionUrl: jest.Mock;
    getClient: jest.Mock;
    evict: jest.Mock;
  };

  beforeEach(async () => {
    platformPrisma = {
      tenant: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(baseTenant),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };
    dbAdmin = {
      createDatabase: jest.fn().mockResolvedValue(undefined),
      dropDatabaseIfExists: jest.fn().mockResolvedValue(undefined),
    };
    migrations = { deploy: jest.fn() };
    connections = {
      buildConnectionUrl: jest.fn().mockReturnValue('postgresql://fake'),
      getClient: jest.fn(),
      evict: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TenantProvisioningService,
        { provide: PlatformPrismaService, useValue: platformPrisma },
        { provide: TenantDatabaseAdminService, useValue: dbAdmin },
        { provide: TenantMigrationService, useValue: migrations },
        { provide: TenantConnectionService, useValue: connections },
      ],
    }).compile();

    service = moduleRef.get(TenantProvisioningService);
  });

  it('leaves the tenant PROVISIONING_FAILED and cleans up when migration fails', async () => {
    migrations.deploy.mockRejectedValue(new Error('migration exploded'));

    await service.provision('tenant-1');

    expect(dbAdmin.createDatabase).toHaveBeenCalledWith('tenant_acme');
    expect(connections.evict).toHaveBeenCalledWith('tenant-1');
    expect(dbAdmin.dropDatabaseIfExists).toHaveBeenCalledWith('tenant_acme');
    expect(platformPrisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { status: 'PROVISIONING_FAILED' },
    });
    expect(platformPrisma.tenant.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ACTIVE' }),
      }),
    );
  });

  it('marks the tenant ACTIVE and seeds defaults when every step succeeds', async () => {
    const seededClient = {
      role: {
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: `role-${data.name}`, ...data }),
          ),
      },
      settings: { create: jest.fn().mockResolvedValue(undefined) },
      theme: { create: jest.fn().mockResolvedValue(undefined) },
      user: { create: jest.fn().mockResolvedValue(undefined) },
    };
    migrations.deploy.mockResolvedValue(undefined);
    connections.getClient.mockResolvedValue(seededClient);

    await service.provision('tenant-1');

    expect(seededClient.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'owner@acme.test',
          passwordHash: 'hashed',
          roleId: 'role-OWNER',
        }),
      }),
    );
    expect(platformPrisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { status: 'ACTIVE', ownerEmail: null, ownerPasswordHash: null },
    });
    expect(dbAdmin.dropDatabaseIfExists).not.toHaveBeenCalled();
  });

  it('refuses to retry a tenant that is not PROVISIONING_FAILED', async () => {
    platformPrisma.tenant.findUniqueOrThrow.mockResolvedValue({
      ...baseTenant,
      status: 'ACTIVE',
    });

    await expect(service.retry('tenant-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(dbAdmin.dropDatabaseIfExists).not.toHaveBeenCalled();
  });
});
