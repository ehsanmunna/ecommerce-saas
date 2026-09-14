import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtAccessTokenPayload } from '@ecommerce-saas/types';

/**
 * Verifies the access token, then enforces the auth spec's tenant
 * cross-check: a token is only ever trusted for the tenant the request
 * independently resolved from its Host, never for whatever tenantId it
 * happens to carry.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtAccessTokenPayload): JwtAccessTokenPayload {
    if (!req.tenant) {
      throw new UnauthorizedException('Tenant could not be resolved for this request');
    }
    if (payload.tenantId !== req.tenant.id) {
      throw new UnauthorizedException('Token tenant does not match the resolved tenant');
    }
    if (payload.type !== 'staff') {
      throw new UnauthorizedException('Token is not a staff access token');
    }
    return payload;
  }
}
