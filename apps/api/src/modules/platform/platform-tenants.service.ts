import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlatformPrismaService } from '../../database/platform/platform-prisma.service';
import { TenantDatabaseAdminService } from '../../database/tenant/tenant-database-admin.service';
import { TenantProvisioningService } from '../tenant/tenant-provisioning.service';
import { TenantRegistrationService } from '../tenant/tenant-registration.service';
import { CreatePlatformTenantDto } from './dto/create-platform-tenant.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';

const TENANT_STATUSES = [
  'PENDING_VERIFICATION',
  'PROVISIONING',
  'ACTIVE',
  'PROVISIONING_FAILED',
  'SUSPENDED',
  'EXPIRED',
  'DELETED',
] as const;

@Injectable()
export class PlatformTenantsService {
  constructor(
    private readonly platformPrisma: PlatformPrismaService,
    private readonly registrationService: TenantRegistrationService,
    private readonly provisioningService: TenantProvisioningService,
    private readonly dbAdmin: TenantDatabaseAdminService,
  ) {}

  async list(query: {
    status?: string;
    plan?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20)));
    const where: Record<string, unknown> = {};
    if (query.status) {
      if (
        !TENANT_STATUSES.includes(
          query.status as (typeof TENANT_STATUSES)[number],
        )
      ) {
        throw new BadRequestException(`Unknown status "${query.status}"`);
      }
      where.status = query.status;
    } else {
      where.status = { not: 'DELETED' };
    }
    if (query.plan) {
      where.plan = query.plan;
    }
    const [items, total] = await this.platformPrisma.$transaction([
      this.platformPrisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.platformPrisma.tenant.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getById(id: string) {
    const tenant = await this.platformPrisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async create(dto: CreatePlatformTenantDto) {
    return this.registrationService.createByPlatformAdmin(dto);
  }

  async updateStatus(id: string, dto: UpdateTenantStatusDto) {
    const tenant = await this.getById(id);
    if (dto.status === 'SUSPENDED') {
      return this.platformPrisma.tenant.update({
        where: { id },
        data: { status: 'SUSPENDED' },
      });
    }
    if (dto.status === 'EXPIRED') {
      return this.platformPrisma.tenant.update({
        where: { id },
        data: { status: 'EXPIRED' },
      });
    }
    if (dto.status === 'ACTIVE') {
      const exists = await this.dbAdmin.databaseExists(tenant.databaseName);
      if (!exists) {
        throw new ConflictException(
          `Cannot activate: database "${tenant.databaseName}" does not exist`,
        );
      }
      return this.platformPrisma.tenant.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });
    }
    throw new BadRequestException(
      'Platform admins may only set status to ACTIVE, SUSPENDED, or EXPIRED',
    );
  }

  async delete(id: string) {
    const tenant = await this.getById(id);
    if (tenant.status === 'DELETED') {
      throw new ConflictException('Tenant is already deleted');
    }
    return this.platformPrisma.tenant.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  async resendVerification(id: string) {
    return this.registrationService.resendVerification(id);
  }

  async revokeVerificationToken(id: string) {
    const tenant = await this.getById(id);
    if (tenant.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(
        'Only tenants pending verification have a token to revoke',
      );
    }
    return this.platformPrisma.tenant.update({
      where: { id },
      data: { verificationTokenHash: null, verificationExpiresAt: null },
    });
  }

  async retryProvisioning(id: string) {
    await this.provisioningService.retry(id);
    return this.getById(id);
  }

  async updatePlan(id: string, plan: string) {
    await this.getById(id);
    return this.platformPrisma.tenant.update({
      where: { id },
      data: { plan },
    });
  }
}
