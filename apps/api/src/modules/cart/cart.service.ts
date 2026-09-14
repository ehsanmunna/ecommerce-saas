import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient as TenantPrismaClient } from '@prisma-clients/tenant';
import { CreateCouponDto } from './dto/create-coupon.dto';

const SHIPPING_FEE = Number(process.env.STOREFRONT_SHIPPING_FEE ?? 5);

type CartWithItems = Prisma.CartGetPayload<{
  include: { items: { include: { variant: { include: { product: true } } } } };
}>;

const round2 = (value: number): number => Math.round(value * 100) / 100;

@Injectable()
export class CartService {
  async getOrCreateCart(tenantDb: TenantPrismaClient, customerId: string) {
    const existing = await tenantDb.cart.findUnique({ where: { customerId } });
    if (existing) return existing;
    return tenantDb.cart.create({ data: { customerId } });
  }

  async getCartView(tenantDb: TenantPrismaClient, customerId: string) {
    const cart = await this.getCartWithItems(tenantDb, customerId);
    return this.buildView(tenantDb, cart);
  }

  async addItem(tenantDb: TenantPrismaClient, customerId: string, variantId: string, quantity: number) {
    const cart = await this.getOrCreateCart(tenantDb, customerId);
    const variant = await tenantDb.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const existingItem = await tenantDb.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });
    const newQuantity = (existingItem?.quantity ?? 0) + quantity;
    if (newQuantity > variant.stock) {
      throw new ConflictException('Requested quantity exceeds available stock');
    }

    if (existingItem) {
      await tenantDb.cartItem.update({ where: { id: existingItem.id }, data: { quantity: newQuantity } });
    } else {
      await tenantDb.cartItem.create({ data: { cartId: cart.id, variantId, quantity } });
    }

    return this.getCartView(tenantDb, customerId);
  }

  async updateItemQuantity(tenantDb: TenantPrismaClient, customerId: string, itemId: string, quantity: number) {
    const item = await this.getOwnedItem(tenantDb, customerId, itemId);
    if (quantity > item.variant.stock) {
      throw new ConflictException('Requested quantity exceeds available stock');
    }
    await tenantDb.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return this.getCartView(tenantDb, customerId);
  }

  async removeItem(tenantDb: TenantPrismaClient, customerId: string, itemId: string) {
    await this.getOwnedItem(tenantDb, customerId, itemId);
    await tenantDb.cartItem.delete({ where: { id: itemId } });
    return this.getCartView(tenantDb, customerId);
  }

  async applyCoupon(tenantDb: TenantPrismaClient, customerId: string, code: string) {
    const coupon = await tenantDb.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive || (coupon.expiresAt && coupon.expiresAt < new Date())) {
      throw new BadRequestException('Invalid or expired coupon code');
    }
    const cart = await this.getOrCreateCart(tenantDb, customerId);
    await tenantDb.cart.update({ where: { id: cart.id }, data: { couponCode: code } });
    return this.getCartView(tenantDb, customerId);
  }

  async removeCoupon(tenantDb: TenantPrismaClient, customerId: string) {
    const cart = await this.getOrCreateCart(tenantDb, customerId);
    await tenantDb.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    return this.getCartView(tenantDb, customerId);
  }

  // --- Staff-facing coupon management ---
  // Minimal by design (design.md): just enough for a coupon to exist to
  // redeem, not a full promotions system.

  createCoupon(tenantDb: TenantPrismaClient, dto: CreateCouponDto) {
    return tenantDb.coupon.create({
      data: {
        code: dto.code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        isActive: dto.isActive ?? true,
      },
    });
  }

  listCoupons(tenantDb: TenantPrismaClient) {
    return tenantDb.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async deactivateCoupon(tenantDb: TenantPrismaClient, id: string) {
    const coupon = await tenantDb.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return tenantDb.coupon.update({ where: { id }, data: { isActive: false } });
  }

  private async getOwnedItem(tenantDb: TenantPrismaClient, customerId: string, itemId: string) {
    const item = await tenantDb.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true, variant: true },
    });
    if (!item || item.cart.customerId !== customerId) {
      throw new ForbiddenException('Cart item not found');
    }
    return item;
  }

  private async getCartWithItems(tenantDb: TenantPrismaClient, customerId: string): Promise<CartWithItems> {
    const cart = await this.getOrCreateCart(tenantDb, customerId);
    return tenantDb.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: { items: { include: { variant: { include: { product: true } } } } },
    });
  }

  private async buildView(tenantDb: TenantPrismaClient, cart: CartWithItems) {
    let subtotal = 0;
    const items = cart.items.map((item) => {
      const unitPrice = Number(item.variant.priceOverride ?? item.variant.product.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      return {
        id: item.id,
        variantId: item.variantId,
        productName: item.variant.product.name,
        sku: item.variant.sku,
        unitPrice,
        quantity: item.quantity,
        lineTotal: round2(lineTotal),
      };
    });

    let discount = 0;
    if (cart.couponCode) {
      const coupon = await tenantDb.coupon.findUnique({ where: { code: cart.couponCode } });
      if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt >= new Date())) {
        discount =
          coupon.discountType === 'PERCENTAGE'
            ? subtotal * (Number(coupon.discountValue) / 100)
            : Number(coupon.discountValue);
        discount = Math.min(discount, subtotal);
      }
    }

    const total = Math.max(0, subtotal - discount) + SHIPPING_FEE;

    return {
      id: cart.id,
      items,
      couponCode: cart.couponCode,
      subtotal: round2(subtotal),
      shipping: round2(SHIPPING_FEE),
      discount: round2(discount),
      total: round2(total),
    };
  }
}
