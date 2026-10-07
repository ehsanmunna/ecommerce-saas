import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  OrderStatus,
  PrismaClient as TenantPrismaClient,
} from '@prisma-clients/tenant';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import { CheckoutDto } from './dto/checkout.dto';

const CANCELLABLE_STATUSES = new Set(['PENDING', 'CONFIRMED']);
const STATUS_SEQUENCE = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

@Injectable()
export class OrdersService {
  constructor(
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Validates stock for every cart item, atomically decrements inventory,
   * creates the order + order items, and clears the cart - all inside one
   * transaction, per design.md. If any item is out of stock,
   * InventoryService throws and the whole transaction rolls back: no
   * order, no partial inventory change, no cart mutation.
   */
  async checkout(
    tenantDb: TenantPrismaClient,
    customerId: string,
    dto: CheckoutDto,
  ) {
    const cartView = await this.cartService.getCartView(tenantDb, customerId);
    if (cartView.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    return tenantDb.$transaction(async (tx) => {
      for (const item of cartView.items) {
        await this.inventoryService.decrementStock(
          tx,
          item.variantId,
          item.quantity,
        );
      }

      const order = await tx.order.create({
        data: {
          customerId,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: dto.paymentMethod,
          deliveryMethod: dto.deliveryMethod,
          shippingRecipient: dto.shippingRecipient,
          shippingLine1: dto.shippingLine1,
          shippingLine2: dto.shippingLine2,
          shippingCity: dto.shippingCity,
          shippingRegion: dto.shippingRegion,
          shippingPostalCode: dto.shippingPostalCode,
          shippingCountry: dto.shippingCountry,
          couponCode: cartView.couponCode ?? undefined,
          subtotal: cartView.subtotal,
          shipping: cartView.shipping,
          total: cartView.total,
          items: {
            create: cartView.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cartView.id } });
      await tx.cart.update({
        where: { id: cartView.id },
        data: { couponCode: null },
      });

      return order;
    });
  }

  listOrders(tenantDb: TenantPrismaClient, customerId: string) {
    return tenantDb.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async getOrder(
    tenantDb: TenantPrismaClient,
    customerId: string,
    orderId: string,
  ) {
    const order = await tenantDb.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  /** Staff-only forward transition: PENDING -> CONFIRMED -> SHIPPED -> DELIVERED, one step at a time. */
  async updateStatus(
    tenantDb: TenantPrismaClient,
    orderId: string,
    targetStatus: string,
  ) {
    const order = await tenantDb.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const currentIndex = STATUS_SEQUENCE.indexOf(order.status);
    const targetIndex = STATUS_SEQUENCE.indexOf(targetStatus);
    if (currentIndex === -1 || targetIndex !== currentIndex + 1) {
      throw new BadRequestException(
        `Cannot transition order from ${order.status} to ${targetStatus}`,
      );
    }
    return tenantDb.order.update({
      where: { id: orderId },
      data: { status: targetStatus as OrderStatus },
    });
  }

  async cancelOrder(
    tenantDb: TenantPrismaClient,
    customerId: string,
    orderId: string,
  ) {
    const order = await this.getOrder(tenantDb, customerId, orderId);
    if (!CANCELLABLE_STATUSES.has(order.status)) {
      throw new BadRequestException('Order can no longer be cancelled');
    }

    await tenantDb.$transaction(async (tx) => {
      for (const item of order.items) {
        await this.inventoryService.restoreStock(
          tx,
          item.variantId,
          item.quantity,
        );
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
    });

    return this.getOrder(tenantDb, customerId, orderId);
  }
}
