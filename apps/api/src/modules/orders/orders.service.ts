import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  OrderStatus,
  Prisma,
  PrismaClient as TenantPrismaClient,
} from '@prisma-clients/tenant';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import { CheckoutDto } from './dto/checkout.dto';
import { ListOrdersDto } from './dto/list-orders.dto';

const CANCELLABLE_STATUSES = new Set(['PENDING', 'CONFIRMED']);
const STATUS_SEQUENCE = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
const DEFAULT_PAGE_SIZE = 20;

const ITEMS_INCLUDE = {
  include: { variant: { include: { product: true } } },
} as const;

const CUSTOMER_ORDER_INCLUDE = {
  items: ITEMS_INCLUDE,
} as const;

const STAFF_ORDER_INCLUDE = {
  items: ITEMS_INCLUDE,
  customer: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
} as const;

type OrderItemWithVariant = Prisma.OrderItemGetPayload<{
  include: { variant: { include: { product: true } } };
}>;

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
    return tenantDb.order
      .findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        include: CUSTOMER_ORDER_INCLUDE,
      })
      .then((orders) => orders.map((order) => this.mapOrder(order)));
  }

  async getOrder(
    tenantDb: TenantPrismaClient,
    customerId: string,
    orderId: string,
  ) {
    const order = await tenantDb.order.findUnique({
      where: { id: orderId },
      include: CUSTOMER_ORDER_INCLUDE,
    });
    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }
    return this.mapOrder(order);
  }

  /** --- Staff-facing order management --- */

  async listStaffOrders(tenantDb: TenantPrismaClient, query: ListOrdersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    const where: Prisma.OrderWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }
    if (query.search) {
      where.OR = [
        { shippingRecipient: { contains: query.search, mode: 'insensitive' } },
        {
          customer: { email: { contains: query.search, mode: 'insensitive' } },
        },
      ];
    }

    const [orders, total] = await Promise.all([
      tenantDb.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: STAFF_ORDER_INCLUDE,
      }),
      tenantDb.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => this.mapOrder(order)),
      total,
      page,
      pageSize,
    };
  }

  async getStaffOrder(tenantDb: TenantPrismaClient, orderId: string) {
    const order = await tenantDb.order.findUnique({
      where: { id: orderId },
      include: STAFF_ORDER_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.mapOrder(order);
  }

  async cancelStaffOrder(tenantDb: TenantPrismaClient, orderId: string) {
    const order = await tenantDb.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    await this.performCancel(tenantDb, order);
    return this.getStaffOrder(tenantDb, orderId);
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
    await this.performCancel(tenantDb, order);
    return this.getOrder(tenantDb, customerId, orderId);
  }

  /**
   * Shared cancellation invariant (design.md): rejects unless the order is
   * still cancellable, then restores stock for every item and marks the
   * order CANCELLED in one transaction. Used by both customer and staff
   * cancellation paths.
   */
  private async performCancel(
    tenantDb: TenantPrismaClient,
    order: {
      id: string;
      status: string;
      items: { variantId: string; quantity: number }[];
    },
  ) {
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
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });
    });
  }

  /**
   * Flattens order items for API responses: each item carries a resolved
   * product name, SKU, and variant attributes (read-time join, per
   * design.md), falling back to SKU/variant id when the product can't be
   * resolved.
   */
  private mapOrder<T extends { items: OrderItemWithVariant[] }>(order: T) {
    return {
      ...order,
      items: order.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        productName:
          item.variant?.product?.name ?? item.variant?.sku ?? item.variantId,
        sku: item.variant?.sku ?? null,
        attributes: item.variant?.attributes ?? null,
      })),
    };
  }
}
