import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import type { CustomerJwtAccessTokenPayload } from '@ecommerce-saas/types';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';

@Controller('storefront/me')
@UseGuards(CustomerAuthGuard)
export class CustomerMeController {
  @Get()
  async getProfile(@Req() req: Request) {
    const payload = req.user as CustomerJwtAccessTokenPayload;
    const customer = await req.tenantDb!.customer.findUnique({
      where: { id: payload.sub },
      include: { addresses: true },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      addresses: customer.addresses,
    };
  }

  @Patch()
  async updateProfile(@Req() req: Request, @Body() dto: UpdateCustomerProfileDto) {
    const payload = req.user as CustomerJwtAccessTokenPayload;
    const customer = await req.tenantDb!.customer.update({
      where: { id: payload.sub },
      data: { firstName: dto.firstName, lastName: dto.lastName },
    });
    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    };
  }

  @Post('addresses')
  addAddress(@Req() req: Request, @Body() dto: CreateAddressDto) {
    const payload = req.user as CustomerJwtAccessTokenPayload;
    return req.tenantDb!.customerAddress.create({
      data: { customerId: payload.sub, ...dto },
    });
  }

  @Delete('addresses/:id')
  async removeAddress(@Req() req: Request, @Param('id') id: string) {
    const payload = req.user as CustomerJwtAccessTokenPayload;
    const address = await req.tenantDb!.customerAddress.findUnique({ where: { id } });
    if (!address || address.customerId !== payload.sub) {
      throw new NotFoundException('Address not found');
    }
    await req.tenantDb!.customerAddress.delete({ where: { id } });
    return { success: true };
  }
}
