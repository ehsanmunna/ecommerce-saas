import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { JwtAccessTokenPayload } from '@ecommerce-saas/types';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtAccessTokenPayload => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user as JwtAccessTokenPayload;
  },
);
