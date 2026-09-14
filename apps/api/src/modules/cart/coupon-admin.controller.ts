import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CartService } from './cart.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Controller('coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class CouponAdminController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateCouponDto) {
    return this.cartService.createCoupon(req.tenantDb!, dto);
  }

  @Get()
  list(@Req() req: Request) {
    return this.cartService.listCoupons(req.tenantDb!);
  }

  @Post(':id/deactivate')
  deactivate(@Req() req: Request, @Param('id') id: string) {
    return this.cartService.deactivateCoupon(req.tenantDb!, id);
  }
}
