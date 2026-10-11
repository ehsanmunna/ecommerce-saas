import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { PlatformPrismaService } from '../../database/platform/platform-prisma.service';
import {
  MailSendError,
  MailService,
  TenantVerificationEmail,
} from '../mail/mail.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { RESERVED_TENANT_SLUGS } from './reserved-slugs';
import { TenantProvisioningService } from './tenant-provisioning.service';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RESEND_THROTTLE_MS = 60 * 1000;

function verificationTtlMs(): number {
  return (
    Number(process.env.VERIFICATION_TOKEN_TTL_HOURS ?? 24) * 60 * 60 * 1000
  );
}

function buildVerifyUrl(rawToken: string): string {
  const base = (process.env.ADMIN_APP_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  return `${base}/verify-email?token=${rawToken}`;
}

@Injectable()
export class TenantRegistrationService {
  constructor(
    private readonly platformPrisma: PlatformPrismaService,
    private readonly provisioning: TenantProvisioningService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterTenantDto) {
    const slug = dto.slug.toLowerCase();
    if (RESERVED_TENANT_SLUGS.has(slug)) {
      throw new BadRequestException(`Slug "${dto.slug}" is reserved`);
    }

    const existing = await this.platformPrisma.tenant.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" is already taken`);
    }

    const databaseName = `tenant_${slug.replace(/-/g, '_')}`;
    const ownerPasswordHash = await bcrypt.hash(dto.ownerPassword, 10);
    const { rawToken, tokenHash, expiresAt } = this.issueToken();

    const tenant = await this.platformPrisma.tenant.create({
      data: {
        name: dto.companyName,
        slug,
        databaseName,
        databaseHost: process.env.TENANT_DB_HOST ?? 'localhost',
        databasePort: Number(process.env.TENANT_DB_PORT ?? 5432),
        status: 'PENDING_VERIFICATION',
        plan: dto.plan,
        ownerEmail: dto.ownerEmail,
        ownerPasswordHash,
        verificationTokenHash: tokenHash,
        verificationExpiresAt: expiresAt,
        lastVerificationSentAt: new Date(),
      },
    });

    await this.sendVerificationEmail({
      to: dto.ownerEmail,
      verifyUrl: buildVerifyUrl(rawToken),
      companyName: dto.companyName,
    });

    const fresh = await this.platformPrisma.tenant.findUniqueOrThrow({
      where: { id: tenant.id },
    });
    return {
      tenant: fresh,
      verificationToken:
        process.env.NODE_ENV === 'production' ? undefined : rawToken,
    };
  }

  async createByPlatformAdmin(dto: RegisterTenantDto) {
    const slug = dto.slug.toLowerCase();
    if (RESERVED_TENANT_SLUGS.has(slug)) {
      throw new BadRequestException(`Slug "${dto.slug}" is reserved`);
    }

    const existing = await this.platformPrisma.tenant.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" is already taken`);
    }

    const databaseName = `tenant_${slug.replace(/-/g, '_')}`;
    const ownerPasswordHash = await bcrypt.hash(dto.ownerPassword, 10);

    const tenant = await this.platformPrisma.tenant.create({
      data: {
        name: dto.companyName,
        slug,
        databaseName,
        databaseHost: process.env.TENANT_DB_HOST ?? 'localhost',
        databasePort: Number(process.env.TENANT_DB_PORT ?? 5432),
        status: 'PROVISIONING',
        plan: dto.plan,
        ownerEmail: dto.ownerEmail,
        ownerPasswordHash,
        emailVerifiedAt: new Date(),
      },
    });

    await this.provisioning.provision(tenant.id);

    return this.platformPrisma.tenant.findUniqueOrThrow({
      where: { id: tenant.id },
    });
  }

  async checkSlug(rawSlug: string) {
    const slug = (rawSlug ?? '').toLowerCase();
    if (!SLUG_PATTERN.test(slug) || slug.length < 3 || slug.length > 63) {
      return { available: false as const, reason: 'invalid' as const };
    }
    if (RESERVED_TENANT_SLUGS.has(slug)) {
      return { available: false as const, reason: 'reserved' as const };
    }
    const existing = await this.platformPrisma.tenant.findUnique({
      where: { slug },
    });
    if (existing) {
      return { available: false as const, reason: 'taken' as const };
    }
    return { available: true as const, reason: undefined };
  }

  async verifyEmail(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const tenant = await this.platformPrisma.tenant.findUnique({
      where: { verificationTokenHash: tokenHash },
    });
    if (!tenant || tenant.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(
        'Verification token is invalid or has already been used',
      );
    }
    if (
      !tenant.verificationExpiresAt ||
      tenant.verificationExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Verification token has expired - request a new one',
      );
    }

    await this.platformPrisma.tenant.update({
      where: { id: tenant.id },
      data: {
        emailVerifiedAt: new Date(),
        status: 'PROVISIONING',
        verificationTokenHash: null,
        verificationExpiresAt: null,
      },
    });

    // Synchronous provisioning on verify (design decision): the verify
    // response waits for DB creation/migration/seeding to finish.
    await this.provisioning.provision(tenant.id);

    return this.platformPrisma.tenant.findUniqueOrThrow({
      where: { id: tenant.id },
    });
  }

  async resendVerification(tenantId: string) {
    const tenant = await this.platformPrisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    if (tenant.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(
        'Only tenants pending verification can resend the verification email',
      );
    }
    if (!tenant.ownerEmail) {
      throw new BadRequestException(
        'Tenant is missing owner email required for verification',
      );
    }
    if (
      tenant.lastVerificationSentAt &&
      Date.now() - tenant.lastVerificationSentAt.getTime() < RESEND_THROTTLE_MS
    ) {
      throw new HttpException(
        'Verification email was sent recently - wait before requesting another',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const { rawToken, tokenHash, expiresAt } = this.issueToken();
    const updated = await this.platformPrisma.tenant.update({
      where: { id: tenant.id },
      data: {
        verificationTokenHash: tokenHash,
        verificationExpiresAt: expiresAt,
        lastVerificationSentAt: new Date(),
      },
    });

    await this.sendVerificationEmail({
      to: updated.ownerEmail!,
      verifyUrl: buildVerifyUrl(rawToken),
      companyName: updated.name,
    });

    const fresh = await this.platformPrisma.tenant.findUniqueOrThrow({
      where: { id: tenant.id },
    });
    return {
      tenant: fresh,
      verificationToken:
        process.env.NODE_ENV === 'production' ? undefined : rawToken,
    };
  }

  async resendVerificationBySlug(slug: string) {
    const tenant = await this.platformPrisma.tenant.findUnique({
      where: { slug },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return this.resendVerification(tenant.id);
  }

  async getStatus(tenantId: string) {
    const tenant = await this.platformPrisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  private async sendVerificationEmail(
    email: TenantVerificationEmail,
  ): Promise<void> {
    try {
      await this.mail.sendTenantVerification(email);
    } catch (error) {
      if (error instanceof MailSendError) {
        const detail =
          error.category === 'connection'
            ? 'cannot connect to mail server'
            : error.category === 'auth'
              ? 'mail server authentication failed'
              : 'mail send failed';
        throw new BadGatewayException(
          `Verification email could not be sent: ${detail}`,
        );
      }
      throw error;
    }
  }

  private issueToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    return {
      rawToken,
      tokenHash: this.hashToken(rawToken),
      expiresAt: new Date(Date.now() + verificationTtlMs()),
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
