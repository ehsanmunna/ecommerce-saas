import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { CatalogService } from './catalog.service';
import { BrowseProductsDto } from './dto/browse-products.dto';

/** Public browsing - tenant-resolved but no login required. */
@Controller('storefront')
export class StorefrontCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  browseProducts(@Req() req: Request, @Query() query: BrowseProductsDto) {
    return this.catalogService.browseProducts(req.tenantDb!, query);
  }

  @Get('categories')
  listCategories(@Req() req: Request) {
    return this.catalogService.listCategories(req.tenantDb!);
  }

  @Get('categories/:slug/products')
  browseCategoryProducts(@Req() req: Request, @Param('slug') slug: string, @Query() query: BrowseProductsDto) {
    return this.catalogService.browseProducts(req.tenantDb!, { ...query, categorySlug: slug });
  }
}
