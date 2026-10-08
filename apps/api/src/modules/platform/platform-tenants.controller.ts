import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePlatformTenantDto } from './dto/create-platform-tenant.dto';
import { UpdateTenantPlanDto } from './dto/update-tenant-plan.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { PlatformAuthGuard } from './platform-auth.guard';
import { PlatformTenantsService } from './platform-tenants.service';

@ApiTags('platform-tenants')
@ApiBearerAuth()
@UseGuards(PlatformAuthGuard)
@Controller('platform/tenants')
export class PlatformTenantsController {
  constructor(private readonly tenantsService: PlatformTenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List tenants (filterable by status/plan)' })
  list(
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.tenantsService.list({
      status,
      plan,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant detail' })
  getById(@Param('id') id: string) {
    return this.tenantsService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create and provision a tenant directly' })
  create(@Body() dto: CreatePlatformTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Suspend or activate a tenant' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTenantStatusDto) {
    return this.tenantsService.updateStatus(id, dto);
  }

  @Patch(':id/plan')
  @ApiOperation({ summary: 'Update a tenant plan' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdateTenantPlanDto) {
    return this.tenantsService.updatePlan(id, dto.plan);
  }

  @Post(':id/resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  resendVerification(@Param('id') id: string) {
    return this.tenantsService.resendVerification(id);
  }

  @Post(':id/revoke-verification-token')
  @ApiOperation({ summary: 'Revoke the current verification token' })
  revokeToken(@Param('id') id: string) {
    return this.tenantsService.revokeVerificationToken(id);
  }

  @Post(':id/retry-provisioning')
  @ApiOperation({ summary: 'Retry failed provisioning' })
  retry(@Param('id') id: string) {
    return this.tenantsService.retryProvisioning(id);
  }
}
