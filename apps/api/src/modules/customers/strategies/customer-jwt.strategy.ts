import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { CustomerJwtAccessTokenPayload } from '@ecommerce-saas/types';

/**
 * Mirrors the staff JwtStrategy, but verifies against
 * JWT_CUSTOMER_ACCESS_SECRET - a different secret from staff's
 * JWT_ACCESS_SECRET, so a customer token can never verify as a staff
 * token or vice versa, even before the `type` claim is checked (see
 * design.md's "separate signing secret, not just a claim check").
 */
@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_CUSTOMER_ACCESS_SECRET ?? 'dev-customer-access-secret-change-me',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: CustomerJwtAccessTokenPayload): CustomerJwtAccessTokenPayload {
    if (!req.tenant) {
      throw new UnauthorizedException('Tenant could not be resolved for this request');
    }
    if (payload.tenantId !== req.tenant.id) {
      throw new UnauthorizedException('Token tenant does not match the resolved tenant');
    }
    if (payload.type !== 'customer') {
      throw new UnauthorizedException('Token is not a customer access token');
    }
    return payload;
  }
}
