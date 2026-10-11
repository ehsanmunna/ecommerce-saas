import { Module } from '@nestjs/common';
import { CatalogAdminController } from './catalog-admin.controller';
import { CatalogService } from './catalog.service';
import { StorefrontCatalogController } from './storefront-catalog.controller';

@Module({
  controllers: [CatalogAdminController, StorefrontCatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
