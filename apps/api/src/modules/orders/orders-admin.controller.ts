import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

/** Staff-only forward status transitions (confirm/ship/deliver an order). */
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class OrdersAdminController {
  constructor(private readonly ordersService: OrdersService) {}

  @Patch(':id/status')
  updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(req.tenantDb!, id, dto.status);
  }
}
