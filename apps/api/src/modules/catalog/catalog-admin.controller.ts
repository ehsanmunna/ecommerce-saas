import { Body, Controller, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateProductDto } from './dto/update-product.dto';

/**
 * Staff-only catalog management. Only OWNER/ADMIN may create or change
 * products/categories/variants - see design.md's "Storefront routes get
 * their own prefix and their own guard" decision.
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class CatalogAdminController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('categories')
  createCategory(@Req() req: Request, @Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(req.tenantDb!, dto);
  }

  @Post('products')
  createProduct(@Req() req: Request, @Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(req.tenantDb!, dto);
  }

  @Patch('products/:id')
  updateProduct(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.catalogService.updateProduct(req.tenantDb!, id, dto);
  }

  @Post('products/:id/deactivate')
  deactivateProduct(@Req() req: Request, @Param('id') id: string) {
    return this.catalogService.deactivateProduct(req.tenantDb!, id);
  }

  @Post('products/:id/variants')
  createVariant(@Req() req: Request, @Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.catalogService.createVariant(req.tenantDb!, id, dto);
  }
}
