import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

/** Staff-only order management: list, detail, status transitions, cancel. */
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class OrdersAdminController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  listOrders(@Req() req: Request, @Query() query: ListOrdersDto) {
    return this.ordersService.listStaffOrders(req.tenantDb!, query);
  }

  @Get(':id')
  getOrder(@Req() req: Request, @Param('id') id: string) {
    return this.ordersService.getStaffOrder(req.tenantDb!, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(req.tenantDb!, id, dto.status);
  }

  @Post(':id/cancel')
  cancelOrder(@Req() req: Request, @Param('id') id: string) {
    return this.ordersService.cancelStaffOrder(req.tenantDb!, id);
  }
}
