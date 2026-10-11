import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import type { CustomerJwtAccessTokenPayload } from '@ecommerce-saas/types';
import type { Tenant } from '@prisma-clients/platform';
import type { PrismaClient as TenantPrismaClient } from '@prisma-clients/tenant';
import { MailService } from '../mail/mail.service';

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL ?? '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const RESET_RATE_LIMIT_MS = 60 * 1000;

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

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

  async forgotPassword(
    tenant: Tenant,
    tenantDb: TenantPrismaClient,
    email: string,
  ): Promise<{ message: string }> {
    const customer = await tenantDb.customer.findUnique({ where: { email } });
    if (!customer)
      return { message: 'If an account exists, a reset email has been sent' };

    const recent = await tenantDb.passwordResetToken.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });
    if (
      recent &&
      Date.now() - recent.createdAt.getTime() < RESET_RATE_LIMIT_MS
    ) {
      return { message: 'If an account exists, a reset email has been sent' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await tenantDb.passwordResetToken.create({
      data: { tokenHash, customerId: customer.id, expiresAt },
    });

    const resetLink = `http://localhost:3002/reset-password?token=${token}`;
    await this.mailService.sendPasswordReset(email, resetLink);

    return { message: 'If an account exists, a reset email has been sent' };
  }

  async resetPassword(
    tenantDb: TenantPrismaClient,
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const tokenHash = this.hashToken(token);
    const record = await tenantDb.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await tenantDb.$transaction([
      tenantDb.customer.update({
        where: { id: record.customerId },
        data: { passwordHash },
      }),
      tenantDb.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      tenantDb.customerRefreshToken.deleteMany({
        where: { customerId: record.customerId },
      }),
    ]);

    return { message: 'Password has been reset' };
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
