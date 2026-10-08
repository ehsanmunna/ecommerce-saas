import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Prisma,
  PrismaClient as TenantPrismaClient,
} from '@prisma-clients/tenant';
import { BrowseProductsDto } from './dto/browse-products.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class CatalogService {
  // --- Staff-facing management ---

  createCategory(tenantDb: TenantPrismaClient, dto: CreateCategoryDto) {
    return tenantDb.category.create({ data: dto });
  }

  async createProduct(tenantDb: TenantPrismaClient, dto: CreateProductDto) {
    const category = await tenantDb.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return tenantDb.product.create({
      data: {
        name: dto.name,
        sku: dto.sku,
        shortDescription: dto.shortDescription,
        description: dto.description,
        regularPrice: dto.regularPrice,
        salePrice: dto.salePrice,
        stockQuantity: dto.stockQuantity ?? 0,
        mainImage: dto.mainImage,
        status: dto.status ?? 'active',
        categoryId: dto.categoryId,
      },
    });
  }

  async updateProduct(
    tenantDb: TenantPrismaClient,
    id: string,
    dto: UpdateProductDto,
  ) {
    await this.getProductOrThrow(tenantDb, id);
    return tenantDb.product.update({ where: { id }, data: dto });
  }

  async deactivateProduct(tenantDb: TenantPrismaClient, id: string) {
    await this.getProductOrThrow(tenantDb, id);
    return tenantDb.product.update({
      where: { id },
      data: { status: 'archived' },
    });
  }

  async createVariant(
    tenantDb: TenantPrismaClient,
    productId: string,
    dto: CreateVariantDto,
  ) {
    await this.getProductOrThrow(tenantDb, productId);
    return tenantDb.productVariant.create({
      data: {
        productId,
        sku: dto.sku,
        attributes: dto.attributes,
        priceOverride: dto.priceOverride,
        stock: dto.stock ?? 0,
      },
    });
  }

  private async getProductOrThrow(tenantDb: TenantPrismaClient, id: string) {
    const product = await tenantDb.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  // --- Storefront-facing browsing ---

  async browseProducts(tenantDb: TenantPrismaClient, query: BrowseProductsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    const where: Prisma.ProductWhereInput = { status: 'active' };
    if (query.categorySlug) {
      where.category = { slug: query.categorySlug };
    }
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.regularPrice = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { regularPrice: 'asc' }
        : query.sort === 'price_desc'
          ? { regularPrice: 'desc' }
          : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      tenantDb.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: true, variants: true },
      }),
      tenantDb.product.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  // --- Staff listing ---

  async listProducts(tenantDb: TenantPrismaClient, query: ListProductsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    const where: Prisma.ProductWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.categorySlug) {
      where.category = { slug: query.categorySlug };
    }
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      tenantDb.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: true, variants: true },
      }),
      tenantDb.product.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  listCategoriesWithCounts(tenantDb: TenantPrismaClient) {
    return tenantDb.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  listCategories(tenantDb: TenantPrismaClient) {
    return tenantDb.category.findMany({ orderBy: { name: 'asc' } });
  }

  async getProductDetail(tenantDb: TenantPrismaClient, id: string) {
    const product = await tenantDb.product.findUnique({
      where: { id },
      include: { category: true, variants: true },
    });
    if (!product || product.status !== 'active') {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
