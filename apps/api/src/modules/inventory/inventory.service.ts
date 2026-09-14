import { ConflictException, Injectable } from '@nestjs/common';
import type { Prisma, PrismaClient as TenantPrismaClient } from '@prisma-clients/tenant';

type TenantTx = TenantPrismaClient | Prisma.TransactionClient;

@Injectable()
export class InventoryService {
  /**
   * Atomically decrements stock only if enough is available - a single
   * conditional UPDATE (not read-then-write), per design.md's "Oversell
   * prevention via a single conditional UPDATE" decision. Throws if the
   * conditional update affects zero rows (insufficient stock).
   */
  async decrementStock(tx: TenantTx, variantId: string, quantity: number): Promise<void> {
    const result = await tx.productVariant.updateMany({
      where: { id: variantId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (result.count === 0) {
      throw new ConflictException(`Insufficient stock for variant ${variantId}`);
    }
  }

  async restoreStock(tx: TenantTx, variantId: string, quantity: number): Promise<void> {
    await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: quantity } },
    });
  }
}
