import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PlatformPrismaService } from '../../database/platform/platform-prisma.service';

@Injectable()
export class PlatformAuthService implements OnModuleInit {
  constructor(
    private readonly platformPrisma: PlatformPrismaService,
    private readonly jwtService: JwtService,
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
}
