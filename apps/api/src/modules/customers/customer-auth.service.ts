import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import type { CustomerJwtAccessTokenPayload } from '@ecommerce-saas/types';
import type { Tenant } from '@prisma-clients/platform';
import type { PrismaClient as TenantPrismaClient } from '@prisma-clients/tenant';

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL ?? '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class CustomerAuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(
    tenantDb: TenantPrismaClient,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) {
    const existing = await tenantDb.customer.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await tenantDb.customer.create({
      data: { email, passwordHash, firstName, lastName },
    });
    return { id: customer.id, email: customer.email };
  }

  async login(
    tenant: Tenant,
    tenantDb: TenantPrismaClient,
    email: string,
    password: string,
  ) {
    const customer = await tenantDb.customer.findUnique({ where: { email } });
    if (!customer || !(await bcrypt.compare(password, customer.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.signAccessToken({
      sub: customer.id,
      tenantId: tenant.id,
      type: 'customer',
    });
    const refreshToken = await this.issueRefreshToken(tenantDb, customer.id);

    return {
      accessToken,
      refreshToken,
      customer: { id: customer.id, email: customer.email },
    };
  }

  async refresh(
    tenant: Tenant,
    tenantDb: TenantPrismaClient,
    refreshToken: string,
  ) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await tenantDb.customerRefreshToken.findFirst({
      where: { tokenHash },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Refresh token is invalid, expired, or revoked',
      );
    }

    const accessToken = this.signAccessToken({
      sub: stored.customerId,
      tenantId: tenant.id,
      type: 'customer',
    });
    return { accessToken };
  }

  async revoke(
    tenantDb: TenantPrismaClient,
    refreshToken: string,
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await tenantDb.customerRefreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private signAccessToken(payload: CustomerJwtAccessTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret:
        process.env.JWT_CUSTOMER_ACCESS_SECRET ??
        'dev-customer-access-secret-change-me',
      expiresIn: ACCESS_TOKEN_TTL,
    });
  }

  private async issueRefreshToken(
    tenantDb: TenantPrismaClient,
    customerId: string,
  ): Promise<string> {
    const refreshToken = crypto.randomBytes(48).toString('hex');
    await tenantDb.customerRefreshToken.create({
      data: {
        customerId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
    return refreshToken;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
