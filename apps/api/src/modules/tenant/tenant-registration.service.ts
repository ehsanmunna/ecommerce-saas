import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PlatformPrismaService } from '../../database/platform/platform-prisma.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { RESERVED_TENANT_SLUGS } from './reserved-slugs';
import { TenantProvisioningService } from './tenant-provisioning.service';

@Injectable()
export class TenantRegistrationService {
  constructor(
    private readonly platformPrisma: PlatformPrismaService,
    private readonly provisioning: TenantProvisioningService,
  ) {}

  async register(dto: RegisterTenantDto) {
    if (RESERVED_TENANT_SLUGS.has(dto.slug)) {
      throw new BadRequestException(`Slug "${dto.slug}" is reserved`);
    }

    const existing = await this.platformPrisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" is already taken`);
    }

    const databaseName = `tenant_${dto.slug.replace(/-/g, '_')}`;
    const ownerPasswordHash = await bcrypt.hash(dto.ownerPassword, 10);

    const tenant = await this.platformPrisma.tenant.create({
      data: {
        name: dto.companyName,
        slug: dto.slug,
        databaseName,
        databaseHost: process.env.TENANT_DB_HOST ?? 'localhost',
        databasePort: Number(process.env.TENANT_DB_PORT ?? 5432),
        status: 'PROVISIONING',
        ownerEmail: dto.ownerEmail,
        ownerPasswordHash,
      },
    });

    // Design decision (design.md): provisioning runs in-process, and the
    // registration response waits for it to finish rather than returning
    // immediately - see the "Synchronous provisioning" risk trade-off.
    await this.provisioning.provision(tenant.id);

    return this.platformPrisma.tenant.findUniqueOrThrow({ where: { id: tenant.id } });
  }

  async getStatus(tenantId: string) {
    const tenant = await this.platformPrisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }
}
