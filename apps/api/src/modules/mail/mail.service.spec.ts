import {
  classifyMailError,
  MailSendError,
  MailService,
  resolveSecureFlag,
} from './mail.service';

const SMTP_ENV_KEYS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
] as const;

describe('resolveSecureFlag', () => {
  it.each(['true', '1', 'yes', 'ssl', 'TRUE', ' Ssl '])(
    'treats %s as secure',
    (value) => {
      expect(resolveSecureFlag(value, 587)).toBe(true);
    },
  );

  it.each([undefined, 'false', '0', 'no', 'tls'])(
    'treats %s as not secure on non-465 ports',
    (value) => {
      expect(resolveSecureFlag(value, 587)).toBe(false);
    },
  );

  it('infers secure for port 465 regardless of the flag', () => {
    expect(resolveSecureFlag(undefined, 465)).toBe(true);
    expect(resolveSecureFlag('false', 465)).toBe(true);
    expect(resolveSecureFlag('ssl', 465)).toBe(true);
  });
});

describe('classifyMailError', () => {
  it.each([
    [
      { code: 'EAUTH' },
      { responseCode: 535 },
      { code: 'EAUTH', responseCode: 535 },
    ],
  ])('classifies %o as auth', (error) => {
    expect(classifyMailError(error)).toBe('auth');
  });

  it.each([
    [{ code: 'ESOCKET' }],
    [{ code: 'ETIMEDOUT' }],
    [{ code: 'ECONNREFUSED' }],
    [{ code: 'ECONNECTION' }],
  ])('classifies %o as connection', (error) => {
    expect(classifyMailError(error)).toBe('connection');
  });

  it('classifies anything else as other', () => {
    expect(classifyMailError(new Error('boom'))).toBe('other');
    expect(classifyMailError({ code: 'EMESSAGE' })).toBe('other');
    expect(classifyMailError('nope')).toBe('other');
    expect(classifyMailError(undefined)).toBe('other');
  });
});

describe('MailService.sendTenantVerification failure classification', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of SMTP_ENV_KEYS) {
      savedEnv[key] = process.env[key];
    }
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_PORT = '587';
  });

  afterEach(() => {
    for (const key of SMTP_ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
    jest.restoreAllMocks();
  });

  function serviceWithFailingTransport(rejection: unknown) {
    const service = new MailService();
    const sendMail = jest.fn().mockRejectedValue(rejection);
    (service as unknown as { transporter: unknown }).transporter = { sendMail };
    return { service, sendMail };
  }

  const email = {
    to: 'owner@acme.test',
    verifyUrl: 'http://localhost:3000/verify-email?token=abc',
    companyName: 'Acme',
  };

  it('throws MailSendError with category connection for socket errors', async () => {
    const { service } = serviceWithFailingTransport(
      Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }),
    );
    await expect(service.sendTenantVerification(email)).rejects.toMatchObject({
      name: 'MailSendError',
      category: 'connection',
    });
  });

  it('throws MailSendError with category auth for rejected credentials', async () => {
    const { service } = serviceWithFailingTransport(
      Object.assign(new Error('Invalid login'), {
        code: 'EAUTH',
        responseCode: 535,
      }),
    );
    await expect(service.sendTenantVerification(email)).rejects.toMatchObject({
      name: 'MailSendError',
      category: 'auth',
    });
  });

  it('throws MailSendError with category other for generic failures', async () => {
    const { service } = serviceWithFailingTransport(new Error('boom'));
    await expect(service.sendTenantVerification(email)).rejects.toMatchObject({
      name: 'MailSendError',
      category: 'other',
    });
  });

  it('sends successfully when the transporter resolves', async () => {
    const service = new MailService();
    const sendMail = jest.fn().mockResolvedValue({ messageId: '1' });
    (service as unknown as { transporter: unknown }).transporter = { sendMail };
    await expect(
      service.sendTenantVerification(email),
    ).resolves.toBeUndefined();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: email.to }),
    );
  });

  it('logs and resolves without a transporter when SMTP is not configured', async () => {
    delete process.env.SMTP_HOST;
    const service = new MailService();
    expect(service.isConfigured).toBe(false);
    await expect(
      service.sendTenantVerification(email),
    ).resolves.toBeUndefined();
  });

  it('MailSendError keeps the original error as cause', async () => {
    const original = Object.assign(new Error('refused'), {
      code: 'ECONNREFUSED',
    });
    const { service } = serviceWithFailingTransport(original);
    const failure = await service
      .sendTenantVerification(email)
      .catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(MailSendError);
    expect((failure as MailSendError).cause).toBe(original);
  });
});

describe('MailService.sendPasswordReset', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of SMTP_ENV_KEYS) {
      savedEnv[key] = process.env[key];
    }
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_PORT = '587';
  });

  afterEach(() => {
    for (const key of SMTP_ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
    jest.restoreAllMocks();
  });

  it('sends password reset email with reset link', async () => {
    const service = new MailService();
    const sendMail = jest.fn().mockResolvedValue({ messageId: '1' });
    (service as unknown as { transporter: unknown }).transporter = { sendMail };
    await service.sendPasswordReset(
      'user@test.com',
      'http://localhost:3000/reset-password?token=abc',
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@test.com',
        subject: 'Reset your password',
      }),
    );
  });

  it('logs and resolves without a transporter when SMTP is not configured', async () => {
    delete process.env.SMTP_HOST;
    const service = new MailService();
    expect(service.isConfigured).toBe(false);
    await expect(
      service.sendPasswordReset(
        'user@test.com',
        'http://localhost:3000/reset-password?token=abc',
      ),
    ).resolves.toBeUndefined();
  });
});
