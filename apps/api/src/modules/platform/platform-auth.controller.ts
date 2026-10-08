import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../auth/dto/login.dto';
import { PlatformAuthService } from './platform-auth.service';

@ApiTags('platform-auth')
@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private readonly authService: PlatformAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Log in as a platform admin' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}
