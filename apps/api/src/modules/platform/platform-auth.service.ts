import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { PlatformPrismaService } from '../../database/platform/platform-prisma.service';
import { MailService } from '../mail/mail.service';

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const RESET_RATE_LIMIT_MS = 60 * 1000;

@Injectable()
export class PlatformAuthService implements OnModuleInit {
  constructor(
    private readonly platformPrisma: PlatformPrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = process.env.PLATFORM_ADMIN_EMAIL;
    const password = process.env.PLATFORM_ADMIN_PASSWORD;
    if (!email || !password) {
      return;
    }
    const existing = await this.platformPrisma.platformAdmin.findUnique({
      where: { email },
    });
    if (!existing) {
      await this.platformPrisma.platformAdmin.create({
        data: { email, passwordHash: await bcrypt.hash(password, 10) },
      });
    }
  }

  async login(email: string, password: string) {
    const admin = await this.platformPrisma.platformAdmin.findUnique({
      where: { email },
    });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.jwtService.sign(
      { sub: admin.id, email: admin.email, type: 'platform' },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
        expiresIn: process.env.JWT_ACCESS_TTL ?? '15m',
      },
    );
    return { accessToken, admin: { id: admin.id, email: admin.email } };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const admin = await this.platformPrisma.platformAdmin.findUnique({
      where: { email },
    });
    if (!admin)
      return { message: 'If an account exists, a reset email has been sent' };

    const recent = await this.platformPrisma.passwordResetToken.findFirst({
      where: { userId: admin.id },
      orderBy: { createdAt: 'desc' },
    });
    if (
      recent &&
      Date.now() - recent.createdAt.getTime() < RESET_RATE_LIMIT_MS
    ) {
      return { message: 'If an account exists, a reset email has been sent' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.platformPrisma.passwordResetToken.create({
      data: { tokenHash, userId: admin.id, expiresAt },
    });

    const resetLink = `http://localhost:3000/platform/reset-password?token=${token}`;
    await this.mailService.sendPasswordReset(email, resetLink);

    return { message: 'If an account exists, a reset email has been sent' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await this.platformPrisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.platformPrisma.$transaction([
      this.platformPrisma.platformAdmin.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.platformPrisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password has been reset' };
  }
}
