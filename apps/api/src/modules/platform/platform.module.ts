import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TenantModule } from '../tenant/tenant.module';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformAuthGuard } from './platform-auth.guard';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformTenantsController } from './platform-tenants.controller';
import { PlatformTenantsService } from './platform-tenants.service';

@Module({
  imports: [TenantModule, JwtModule.register({})],
  controllers: [PlatformAuthController, PlatformTenantsController],
  providers: [PlatformAuthService, PlatformTenantsService, PlatformAuthGuard],
})
export class PlatformModule {}
