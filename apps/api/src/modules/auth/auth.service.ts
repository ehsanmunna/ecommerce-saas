import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import type { JwtAccessTokenPayload } from '@ecommerce-saas/types';
import type { Tenant } from '@prisma-clients/platform';
import type { PrismaClient as TenantPrismaClient } from '@prisma-clients/tenant';

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL ?? '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(tenant: Tenant, tenantDb: TenantPrismaClient, email: string, password: string) {
    const user = await tenantDb.user.findUnique({ where: { email }, include: { role: true } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.signAccessToken({ sub: user.id, tenantId: tenant.id, role: user.role.name });
    const refreshToken = await this.issueRefreshToken(tenantDb, user.id);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role.name },
    };
  }

  async refresh(tenant: Tenant, tenantDb: TenantPrismaClient, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await tenantDb.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: { include: { role: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid, expired, or revoked');
    }

    const accessToken = this.signAccessToken({
      sub: stored.user.id,
      tenantId: tenant.id,
      role: stored.user.role.name,
    });

    return { accessToken };
  }

  async revoke(tenantDb: TenantPrismaClient, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await tenantDb.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private signAccessToken(payload: JwtAccessTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
      expiresIn: ACCESS_TOKEN_TTL,
    });
  }

  private async issueRefreshToken(tenantDb: TenantPrismaClient, userId: string): Promise<string> {
    const refreshToken = crypto.randomBytes(48).toString('hex');
    await tenantDb.refreshToken.create({
      data: {
        userId,
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
