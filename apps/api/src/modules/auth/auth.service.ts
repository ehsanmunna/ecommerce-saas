import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import type { JwtAccessTokenPayload } from '@ecommerce-saas/types';
import type { Tenant } from '@prisma-clients/platform';
import type { PrismaClient as TenantPrismaClient } from '@prisma-clients/tenant';
import { MailService } from '../mail/mail.service';
import { PlatformPrismaService } from '../../database/platform/platform-prisma.service';

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL ?? '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const RESET_RATE_LIMIT_MS = 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly platformPrisma: PlatformPrismaService,
  ) {}

  async login(
    tenant: Tenant,
    tenantDb: TenantPrismaClient,
    email: string,
    password: string,
  ) {
    const user = await tenantDb.user.findUnique({
      where: { email },
      include: { role: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.signAccessToken({
      sub: user.id,
      tenantId: tenant.id,
      role: user.role.name,
      type: 'staff',
    });
    const refreshToken = await this.issueRefreshToken(tenantDb, user.id);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role.name },
    };
  }

  async refresh(
    tenant: Tenant,
    tenantDb: TenantPrismaClient,
    refreshToken: string,
  ) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await tenantDb.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: { include: { role: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Refresh token is invalid, expired, or revoked',
      );
    }

    const accessToken = this.signAccessToken({
      sub: stored.user.id,
      tenantId: tenant.id,
      role: stored.user.role.name,
      type: 'staff',
    });

    return { accessToken };
  }

  async revoke(
    tenantDb: TenantPrismaClient,
    refreshToken: string,
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await tenantDb.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(
    tenant: Tenant,
    tenantDb: TenantPrismaClient,
    email: string,
  ): Promise<{ message: string }> {
    try {
      const user = await tenantDb.user.findUnique({ where: { email } });
      if (!user)
        return { message: 'If an account exists, a reset email has been sent' };

      const recent = await this.platformPrisma.passwordResetToken.findFirst({
        where: { userId: user.id },
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

      await this.platformPrisma.passwordResetToken.create({
        data: { tokenHash, userId: user.id, expiresAt },
      });

      const resetLink = `http://localhost:3000/reset-password?token=${token}&slug=${tenant.slug}`;
      await this.mailService.sendPasswordReset(email, resetLink);

      return { message: 'If an account exists, a reset email has been sent' };
    } catch {
      throw new InternalServerErrorException(
        'Unable to process password reset request',
      );
    }
  }

  async resetPassword(
    tenantDb: TenantPrismaClient,
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const tokenHash = this.hashToken(token);
      const record = await this.platformPrisma.passwordResetToken.findUnique({
        where: { tokenHash },
      });

      if (!record || record.usedAt || record.expiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired token');
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await this.platformPrisma.$transaction([
        this.platformPrisma.passwordResetToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        }),
      ]);
      await tenantDb.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });
      await tenantDb.refreshToken.deleteMany({
        where: { userId: record.userId },
      });

      return { message: 'Password has been reset' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Unable to process password reset request',
      );
    }
  }

  private signAccessToken(payload: JwtAccessTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
      expiresIn: ACCESS_TOKEN_TTL,
    });
  }

  private async issueRefreshToken(
    tenantDb: TenantPrismaClient,
    userId: string,
  ): Promise<string> {
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
