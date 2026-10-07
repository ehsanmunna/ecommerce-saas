import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Tenant } from '@prisma-clients/platform';
import { CheckSlugResponseDto } from './dto/check-slug-response.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { TenantSummaryResponseDto } from './dto/tenant-summary-response.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
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
    summary: 'Register a new tenant (verify-first)',
    description:
      'Creates the tenant record with status PENDING_VERIFICATION and sends a verification email. ' +
      'No database is provisioned until the owner verifies via POST /tenants/verify-email.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant created, verification email sent',
    type: TenantSummaryResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Slug is already taken' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or reserved slug, or invalid input',
  })
  @ApiResponse({
    status: 502,
    description:
      'Verification email could not be sent (mail server unreachable, auth failed, or send failed)',
  })
  async register(@Body() dto: RegisterTenantDto) {
    const { tenant, verificationToken } =
      await this.registrationService.register(dto);
    return { ...this.toPublicTenant(tenant), verificationToken };
  }

  @Get('check-slug')
  @ApiOperation({ summary: 'Check whether a tenant slug is available' })
  @ApiResponse({ status: 200, type: CheckSlugResponseDto })
  async checkSlug(@Query('slug') slug: string) {
    return this.registrationService.checkSlug(slug ?? '');
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify owner email and provision the tenant',
    description:
      'Validates the single-use verification token, transitions the tenant to PROVISIONING, ' +
      'and synchronously runs provisioning. Returns ACTIVE on success or PROVISIONING_FAILED on failure.',
  })
  @ApiResponse({
    status: 201,
    description: 'Email verified, provisioning finished',
    type: TenantSummaryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid, already-used, or expired token',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const tenant = await this.registrationService.verifyEmail(dto.token);
    return this.toPublicTenant(tenant);
  }

  @Post('resend-verification-by-slug')
  @ApiOperation({
    summary:
      'Resend the verification email for a pending tenant identified by slug',
  })
  @ApiResponse({ status: 201, type: TenantSummaryResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({
    status: 400,
    description: 'Tenant is not currently PENDING_VERIFICATION',
  })
  @ApiResponse({
    status: 429,
    description: 'Verification email was sent too recently',
  })
  @ApiResponse({
    status: 502,
    description:
      'Verification email could not be sent (mail server unreachable, auth failed, or send failed)',
  })
  async resendVerificationBySlug(@Body() dto: { slug: string }) {
    const { tenant, verificationToken } =
      await this.registrationService.resendVerificationBySlug(dto.slug);
    return { ...this.toPublicTenant(tenant), verificationToken };
  }

  @Get(':id/status')
  @ApiOperation({ summary: "Get a tenant's current status" })
  @ApiResponse({ status: 200, type: TenantSummaryResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getStatus(@Param('id') id: string) {
    const tenant = await this.registrationService.getStatus(id);
    return this.toPublicTenant(tenant);
  }

  @Post(':id/resend-verification')
  @ApiOperation({
    summary: 'Resend the verification email for a tenant pending verification',
  })
  @ApiResponse({ status: 201, type: TenantSummaryResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Tenant is not currently PENDING_VERIFICATION',
  })
  @ApiResponse({
    status: 429,
    description: 'Verification email was sent too recently',
  })
  @ApiResponse({
    status: 502,
    description:
      'Verification email could not be sent (mail server unreachable, auth failed, or send failed)',
  })
  async resendVerification(@Param('id') id: string) {
    const { tenant, verificationToken } =
      await this.registrationService.resendVerification(id);
    return { ...this.toPublicTenant(tenant), verificationToken };
  }

  @Post(':id/retry-provisioning')
  @ApiOperation({
    summary: 'Retry provisioning for a tenant stuck in PROVISIONING_FAILED',
  })
  @ApiResponse({ status: 201, type: TenantSummaryResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Tenant is not currently PROVISIONING_FAILED',
  })
  async retryProvisioning(@Param('id') id: string) {
    await this.provisioningService.retry(id);
    const tenant = await this.registrationService.getStatus(id);
    return this.toPublicTenant(tenant);
  }

  private toPublicTenant(tenant: Tenant) {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
    };
  }
}
