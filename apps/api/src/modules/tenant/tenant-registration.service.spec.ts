import { BadGatewayException } from '@nestjs/common';
import { PlatformPrismaService } from '../../database/platform/platform-prisma.service';
import { MailSendError, MailService } from '../mail/mail.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { TenantRegistrationService } from './tenant-registration.service';

const dto: RegisterTenantDto = {
  companyName: 'Acme Inc',
  slug: 'acme',
  ownerEmail: 'owner@acme.test',
  ownerPassword: 'supersecret123',
  plan: 'BASIC',
};

const pendingTenant = {
  id: 'tenant-1',
  name: 'Acme Inc',
  slug: 'acme',
  status: 'PENDING_VERIFICATION',
  ownerEmail: 'owner@acme.test',
  lastVerificationSentAt: new Date(Date.now() - 10 * 60 * 1000),
};

describe('TenantRegistrationService mail failure mapping', () => {
  let service: TenantRegistrationService;
  let platformPrisma: {
    tenant: {
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let provisioning: { provision: jest.Mock };
  let mail: { sendTenantVerification: jest.Mock };

  beforeEach(() => {
    platformPrisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue(null),
        findUniqueOrThrow: jest.fn().mockResolvedValue(pendingTenant),
        create: jest.fn().mockResolvedValue(pendingTenant),
        update: jest.fn().mockResolvedValue(pendingTenant),
      },
    };
    provisioning = { provision: jest.fn() };
    mail = { sendTenantVerification: jest.fn() };

    service = new TenantRegistrationService(
      platformPrisma as unknown as PlatformPrismaService,
      provisioning as unknown as TenantProvisioningService,
      mail as unknown as MailService,
    );
  });

  it('register maps a connection failure to 502 and keeps the tenant PENDING_VERIFICATION', async () => {
    mail.sendTenantVerification.mockRejectedValue(
      new MailSendError('connection', 'Failed to send (connection)'),
    );

    const failure = await service.register(dto).catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(BadGatewayException);
    expect((failure as BadGatewayException).getStatus()).toBe(502);
    expect((failure as BadGatewayException).message).toContain(
      'cannot connect to mail server',
    );
    expect(platformPrisma.tenant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING_VERIFICATION' }),
      }),
    );
    expect(platformPrisma.tenant.update).not.toHaveBeenCalled();
  });

  it('register maps an auth failure to 502 with a safe message', async () => {
    mail.sendTenantVerification.mockRejectedValue(
      new MailSendError('auth', 'Failed to send (auth)'),
    );

    const failure = await service.register(dto).catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(BadGatewayException);
    expect((failure as BadGatewayException).message).toContain(
      'mail server authentication failed',
    );
  });

  it('register rethrows non-mail errors untouched', async () => {
    const unexpected = new Error('unexpected');
    mail.sendTenantVerification.mockRejectedValue(unexpected);

    await expect(service.register(dto)).rejects.toBe(unexpected);
  });

  it('resend maps a connection failure to 502 instead of an unhandled 500', async () => {
    platformPrisma.tenant.findUnique.mockResolvedValue(pendingTenant);
    mail.sendTenantVerification.mockRejectedValue(
      new MailSendError('connection', 'Failed to send (connection)'),
    );

    const failure = await service
      .resendVerification(pendingTenant.id)
      .catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(BadGatewayException);
    expect((failure as BadGatewayException).getStatus()).toBe(502);
    expect((failure as BadGatewayException).message).toContain(
      'cannot connect to mail server',
    );
  });

  it('resend maps an auth failure to 502 with a safe message and no internals', async () => {
    platformPrisma.tenant.findUnique.mockResolvedValue(pendingTenant);
    mail.sendTenantVerification.mockRejectedValue(
      new MailSendError('auth', 'Failed to send (auth)'),
    );

    const failure = await service
      .resendVerification(pendingTenant.id)
      .catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(BadGatewayException);
    expect((failure as BadGatewayException).message).toContain(
      'mail server authentication failed',
    );
    expect((failure as BadGatewayException).message).not.toContain('EAUTH');
  });

  it('register succeeds when the mail send succeeds', async () => {
    mail.sendTenantVerification.mockResolvedValue(undefined);

    const result = await service.register(dto);

    expect(result.tenant).toEqual(pendingTenant);
    expect(mail.sendTenantVerification).toHaveBeenCalledWith(
      expect.objectContaining({
        to: dto.ownerEmail,
        companyName: dto.companyName,
      }),
    );
  });
});
