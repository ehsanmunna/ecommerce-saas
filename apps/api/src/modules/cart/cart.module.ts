import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CouponAdminController } from './coupon-admin.controller';

@Module({
  controllers: [CartController, CouponAdminController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
