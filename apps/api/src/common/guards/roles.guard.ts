import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import type { JwtAccessTokenPayload } from '@ecommerce-saas/types';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Runs after JwtAuthGuard (which populates req.user). Phase 1 only ever
 * checked tenant identity, not in-tenant permissions - this is the first
 * place a staff member's role actually gates an action.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as JwtAccessTokenPayload | undefined;
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role for this action');
    }
    return true;
  }
}
