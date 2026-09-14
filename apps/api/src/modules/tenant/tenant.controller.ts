import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Tenant } from '@prisma-clients/platform';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { TenantSummaryResponseDto } from './dto/tenant-summary-response.dto';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { TenantRegistrationService } from './tenant-registration.service';

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly registrationService: TenantRegistrationService,
    private readonly provisioningService: TenantProvisioningService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new tenant',
    description:
      'Creates the tenant record and synchronously runs provisioning (database creation, ' +
      'migration, seeding). The response reflects the final status - ACTIVE on success, ' +
      'PROVISIONING_FAILED if any provisioning step failed.',
  })
  @ApiResponse({ status: 201, description: 'Tenant created', type: TenantSummaryResponseDto })
  @ApiResponse({ status: 409, description: 'Slug is already taken' })
  @ApiResponse({ status: 400, description: 'Invalid or reserved slug, or invalid input' })
  async register(@Body() dto: RegisterTenantDto) {
    const tenant = await this.registrationService.register(dto);
    return this.toPublicTenant(tenant);
  }

  @Get(':id/status')
  @ApiOperation({ summary: "Get a tenant's current status" })
  @ApiResponse({ status: 200, type: TenantSummaryResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getStatus(@Param('id') id: string) {
    const tenant = await this.registrationService.getStatus(id);
    return this.toPublicTenant(tenant);
  }

  @Post(':id/retry-provisioning')
  @ApiOperation({ summary: 'Retry provisioning for a tenant stuck in PROVISIONING_FAILED' })
  @ApiResponse({ status: 201, type: TenantSummaryResponseDto })
  @ApiResponse({ status: 400, description: 'Tenant is not currently PROVISIONING_FAILED' })
  async retryProvisioning(@Param('id') id: string) {
    await this.provisioningService.retry(id);
    const tenant = await this.registrationService.getStatus(id);
    return this.toPublicTenant(tenant);
  }

  private toPublicTenant(tenant: Tenant) {
    return { id: tenant.id, name: tenant.name, slug: tenant.slug, status: tenant.status };
  }
}
