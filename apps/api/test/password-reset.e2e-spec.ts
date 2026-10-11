import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'node:crypto';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/modules/mail/mail.service';

describe('Password reset (e2e)', () => {
  let app: INestApplication;
  let mailService: MailService;
  let originalSendPasswordReset: typeof MailService.prototype.sendPasswordReset;
  const resetLinks = new Map<string, string>();

  function uniqueSlug(prefix: string): string {
    return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
  }

  async function registerAndVerify(prefix: string) {
    const slug = uniqueSlug(prefix);
    const ownerEmail = `owner@${slug}.test`;
    const ownerPassword = 'supersecret123';
    const regRes = await request(app.getHttpServer())
      .post('/tenants/register')
      .send({
        companyName: 'Acme',
        slug,
        ownerEmail,
        ownerPassword,
        plan: 'BASIC',
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/tenants/verify-email')
      .send({ token: regRes.body.verificationToken })
      .expect(201);
    return { slug, ownerEmail, ownerPassword };
  }

  function extractToken(email: string): string {
    const link = resetLinks.get(email);
    if (!link) throw new Error(`No reset link captured for ${email}`);
    const url = new URL(link);
    return url.searchParams.get('token')!;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    mailService = app.get(MailService);
    originalSendPasswordReset = mailService.sendPasswordReset.bind(mailService);
    mailService.sendPasswordReset = async (
      email: string,
      resetLink: string,
    ) => {
      resetLinks.set(email, resetLink);
    };
  });

  afterAll(async () => {
    mailService.sendPasswordReset = originalSendPasswordReset;
    await app.close();
  });

  describe('staff', () => {
    it('forgot-password generates token and returns 200', async () => {
      const { slug, ownerEmail } = await registerAndVerify('staff-forgot');
      resetLinks.clear();

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .set('x-tenant-slug', slug)
        .send({ email: ownerEmail })
        .expect(201);

      expect(resetLinks.has(ownerEmail)).toBe(true);
      const link = resetLinks.get(ownerEmail)!;
      expect(link).toContain(`slug=${slug}`);
    });

    it('reset-password with valid token succeeds', async () => {
      const { slug, ownerEmail, ownerPassword } =
        await registerAndVerify('staff-reset');
      resetLinks.clear();

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .set('x-tenant-slug', slug)
        .send({ email: ownerEmail })
        .expect(201);

      const token = extractToken(ownerEmail);
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .set('x-tenant-slug', slug)
        .send({ token, newPassword: 'newpassword456' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-slug', slug)
        .send({ email: ownerEmail, password: 'newpassword456' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-slug', slug)
        .send({ email: ownerEmail, password: ownerPassword })
        .expect(401);
    });

    it('reset-password with reused token returns 400', async () => {
      const { slug, ownerEmail } = await registerAndVerify('staff-reuse');
      resetLinks.clear();

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .set('x-tenant-slug', slug)
        .send({ email: ownerEmail })
        .expect(201);

      const token = extractToken(ownerEmail);
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .set('x-tenant-slug', slug)
        .send({ token, newPassword: 'newpassword456' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .set('x-tenant-slug', slug)
        .send({ token, newPassword: 'anotherpassword789' })
        .expect(400);
    });

    it('forgot-password for non-existent email returns same response', async () => {
      const { slug } = await registerAndVerify('staff-nonexistent');
      resetLinks.clear();

      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .set('x-tenant-slug', slug)
        .send({
          email: `nobody-${crypto.randomBytes(4).toString('hex')}@test.com`,
        })
        .expect(201);

      expect(res.body.message).toBe(
        'If an account exists, a reset email has been sent',
      );
      expect(resetLinks.size).toBe(0);
    });
  });

  describe('customer', () => {
    it('forgot-password generates token and returns 200', async () => {
      const { slug } = await registerAndVerify('cust-forgot');
      const email = `customer-${crypto.randomBytes(4).toString('hex')}@test.com`;
      resetLinks.clear();

      await request(app.getHttpServer())
        .post('/storefront/auth/register')
        .set('x-tenant-slug', slug)
        .send({ email, password: 'customerpass123' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/storefront/auth/forgot-password')
        .set('x-tenant-slug', slug)
        .send({ email })
        .expect(201);

      expect(resetLinks.has(email)).toBe(true);
    });

    it('reset-password with valid token succeeds', async () => {
      const { slug } = await registerAndVerify('cust-reset');
      const email = `customer-${crypto.randomBytes(4).toString('hex')}@test.com`;
      resetLinks.clear();

      await request(app.getHttpServer())
        .post('/storefront/auth/register')
        .set('x-tenant-slug', slug)
        .send({ email, password: 'customerpass123' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/storefront/auth/forgot-password')
        .set('x-tenant-slug', slug)
        .send({ email })
        .expect(201);

      const token = extractToken(email);
      await request(app.getHttpServer())
        .post('/storefront/auth/reset-password')
        .set('x-tenant-slug', slug)
        .send({ token, newPassword: 'newcustomerpass456' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/storefront/auth/login')
        .set('x-tenant-slug', slug)
        .send({ email, password: 'newcustomerpass456' })
        .expect(201);
    });
  });

  describe('platform admin', () => {
    it('forgot-password generates token and returns 200', async () => {
      const email = process.env.PLATFORM_ADMIN_EMAIL ?? 'grmunnabd@gmail.com';
      resetLinks.clear();

      await request(app.getHttpServer())
        .post('/platform/auth/forgot-password')
        .send({ email })
        .expect(201);

      expect(resetLinks.has(email)).toBe(true);
    });

    it('reset-password with valid token succeeds', async () => {
      const email = process.env.PLATFORM_ADMIN_EMAIL ?? 'grmunnabd@gmail.com';
      const originalPassword =
        process.env.PLATFORM_ADMIN_PASSWORD ?? 'asdf1234';
      resetLinks.clear();

      await request(app.getHttpServer())
        .post('/platform/auth/forgot-password')
        .send({ email })
        .expect(201);

      const token = extractToken(email);
      await request(app.getHttpServer())
        .post('/platform/auth/reset-password')
        .send({ token, newPassword: 'newplatformpass789' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/platform/auth/login')
        .send({ email, password: 'newplatformpass789' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/platform/auth/forgot-password')
        .send({ email })
        .expect(201);

      const restoreToken = extractToken(email);
      await request(app.getHttpServer())
        .post('/platform/auth/reset-password')
        .send({ token: restoreToken, newPassword: originalPassword })
        .expect(201);
    });
  });

  describe('rate limiting', () => {
    it('rapid successive forgot-password requests are rate-limited', async () => {
      const { slug, ownerEmail } = await registerAndVerify('ratelimit');
      resetLinks.clear();

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .set('x-tenant-slug', slug)
        .send({ email: ownerEmail })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .set('x-tenant-slug', slug)
        .send({ email: ownerEmail })
        .expect(429);
    });
  });
});
