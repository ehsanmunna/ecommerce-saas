import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import type { CustomerJwtAccessTokenPayload } from '@ecommerce-saas/types';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import { CheckoutDto } from './dto/checkout.dto';
import { OrdersService } from './orders.service';

@Controller('storefront')
@UseGuards(CustomerAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@Req() req: Request, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(
      req.tenantDb!,
      this.customerId(req),
      dto,
    );
  }

  @Get('orders')
  listOrders(@Req() req: Request) {
    return this.ordersService.listOrders(req.tenantDb!, this.customerId(req));
  }

  @Get('orders/:id')
  getOrder(@Req() req: Request, @Param('id') id: string) {
    return this.ordersService.getOrder(req.tenantDb!, this.customerId(req), id);
  }

  @Post('orders/:id/cancel')
  cancelOrder(@Req() req: Request, @Param('id') id: string) {
    return this.ordersService.cancelOrder(
      req.tenantDb!,
      this.customerId(req),
      id,
    );
  }

  private customerId(req: Request): string {
    return (req.user as CustomerJwtAccessTokenPayload).sub;
  }
}
