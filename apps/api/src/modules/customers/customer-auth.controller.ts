import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { LoginDto } from '../auth/dto/login.dto';
import { RefreshTokenDto } from '../auth/dto/refresh-token.dto';
import { CustomerAuthService } from './customer-auth.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';

@Controller('storefront/auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('register')
  register(@Req() req: Request, @Body() dto: RegisterCustomerDto) {
    return this.customerAuthService.register(req.tenantDb!, dto.email, dto.password, dto.firstName, dto.lastName);
  }

  @Post('login')
  login(@Req() req: Request, @Body() dto: LoginDto) {
    return this.customerAuthService.login(req.tenant!, req.tenantDb!, dto.email, dto.password);
  }

  @Post('refresh')
  refresh(@Req() req: Request, @Body() dto: RefreshTokenDto) {
    return this.customerAuthService.refresh(req.tenant!, req.tenantDb!, dto.refreshToken);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Body() dto: RefreshTokenDto) {
    await this.customerAuthService.revoke(req.tenantDb!, dto.refreshToken);
    return { success: true };
  }
}
