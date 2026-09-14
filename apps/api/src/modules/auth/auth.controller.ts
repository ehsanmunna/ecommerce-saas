import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { TENANT_SLUG_HEADER } from '../../common/swagger/tenant-slug-header';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@ApiHeader(TENANT_SLUG_HEADER)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: "Log in against the resolved tenant's user table" })
  @ApiResponse({ status: 201, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Req() req: Request, @Body() dto: LoginDto) {
    return this.authService.login(req.tenant!, req.tenantDb!, dto.email, dto.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Exchange a valid refresh token for a new access token' })
  @ApiResponse({ status: 201, type: RefreshResponseDto })
  @ApiResponse({ status: 401, description: 'Refresh token is invalid, expired, or revoked' })
  refresh(@Req() req: Request, @Body() dto: RefreshTokenDto) {
    return this.authService.refresh(req.tenant!, req.tenantDb!, dto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke a refresh token' })
  @ApiResponse({ status: 201, schema: { example: { success: true } } })
  async logout(@Req() req: Request, @Body() dto: RefreshTokenDto) {
    await this.authService.revoke(req.tenantDb!, dto.refreshToken);
    return { success: true };
  }
}
