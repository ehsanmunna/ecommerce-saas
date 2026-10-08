import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { TenantRegistrationService } from './tenant-registration.service';

@Module({
  controllers: [TenantController],
  providers: [TenantRegistrationService, TenantProvisioningService],
  exports: [TenantProvisioningService, TenantRegistrationService],
})
export class TenantModule {}
