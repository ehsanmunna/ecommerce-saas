import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import type { CustomerJwtAccessTokenPayload } from '@ecommerce-saas/types';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartService } from './cart.service';

@Controller('storefront/cart')
@UseGuards(CustomerAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req: Request) {
    return this.cartService.getCartView(req.tenantDb!, this.customerId(req));
  }

  @Post('items')
  addItem(@Req() req: Request, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(
      req.tenantDb!,
      this.customerId(req),
      dto.variantId,
      dto.quantity,
    );
  }

  @Patch('items/:itemId')
  updateItem(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(
      req.tenantDb!,
      this.customerId(req),
      itemId,
      dto.quantity,
    );
  }

  @Delete('items/:itemId')
  removeItem(@Req() req: Request, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(
      req.tenantDb!,
      this.customerId(req),
      itemId,
    );
  }

  @Post('coupon')
  applyCoupon(@Req() req: Request, @Body() dto: ApplyCouponDto) {
    return this.cartService.applyCoupon(
      req.tenantDb!,
      this.customerId(req),
      dto.code,
    );
  }

  @Delete('coupon')
  removeCoupon(@Req() req: Request) {
    return this.cartService.removeCoupon(req.tenantDb!, this.customerId(req));
  }

  private customerId(req: Request): string {
    return (req.user as CustomerJwtAccessTokenPayload).sub;
  }
}
