import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../auth/dto/login.dto';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformForgotPasswordDto } from './dto/platform-forgot-password.dto';
import { PlatformResetPasswordDto } from './dto/platform-reset-password.dto';

@ApiTags('platform-auth')
@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private readonly authService: PlatformAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Log in as a platform admin' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset email' })
  forgotPassword(@Body() dto: PlatformForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with a valid token' })
  resetPassword(@Body() dto: PlatformResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
