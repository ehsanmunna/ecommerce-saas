import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import type { JwtAccessTokenPayload } from '@ecommerce-saas/types';
import { TENANT_SLUG_HEADER } from '../../common/swagger/tenant-slug-header';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MeResponseDto } from './dto/me-response.dto';

@ApiTags('me')
@ApiBearerAuth()
@ApiHeader(TENANT_SLUG_HEADER)
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  @Get()
  @ApiOperation({
    summary: 'Get the current authenticated user and their tenant context',
  })
  @ApiResponse({ status: 200, type: MeResponseDto })
  @ApiResponse({
    status: 401,
    description:
      'Missing/invalid token, or the token tenant does not match the resolved tenant',
  })
  async getMe(@Req() req: Request) {
    const payload = req.user as JwtAccessTokenPayload;
    const tenant = req.tenant!;
    const dbUser = await req.tenantDb!.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
      },
      user: dbUser
        ? { id: dbUser.id, email: dbUser.email, role: dbUser.role.name }
        : null,
    };
  }
}
