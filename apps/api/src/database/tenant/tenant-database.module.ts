import { Global, Module } from '@nestjs/common';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantDatabaseAdminService } from './tenant-database-admin.service';
import { TenantMigrationService } from './tenant-migration.service';

@Global()
@Module({
  providers: [TenantConnectionService, TenantDatabaseAdminService, TenantMigrationService],
  exports: [TenantConnectionService, TenantDatabaseAdminService, TenantMigrationService],
})
export class TenantDatabaseModule {}
