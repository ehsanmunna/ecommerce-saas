import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { TENANT_SLUG_HEADER } from '../../common/swagger/tenant-slug-header';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
    return this.authService.login(
      req.tenant!,
      req.tenantDb!,
      dto.email,
      dto.password,
    );
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Exchange a valid refresh token for a new access token',
  })
  @ApiResponse({ status: 201, type: RefreshResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Refresh token is invalid, expired, or revoked',
  })
  refresh(@Req() req: Request, @Body() dto: RefreshTokenDto) {
    return this.authService.refresh(
      req.tenant!,
      req.tenantDb!,
      dto.refreshToken,
    );
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke a refresh token' })
  @ApiResponse({ status: 201, schema: { example: { success: true } } })
  async logout(@Req() req: Request, @Body() dto: RefreshTokenDto) {
    await this.authService.revoke(req.tenantDb!, dto.refreshToken);
    return { success: true };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({
    status: 201,
    schema: {
      example: { message: 'If an account exists, a reset email has been sent' },
    },
  })
  forgotPassword(@Req() req: Request, @Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(
      req.tenant!,
      req.tenantDb!,
      dto.email,
    );
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with a valid token' })
  @ApiResponse({
    status: 201,
    schema: { example: { message: 'Password has been reset' } },
  })
  resetPassword(@Req() req: Request, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      req.tenantDb!,
      dto.token,
      dto.newPassword,
    );
  }
}
