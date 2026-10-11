import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'node:crypto';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Integration tests against a real Postgres instance (see
 * apps/api/.env.example / docker-compose.yml) - registration and
 * provisioning genuinely create and migrate databases, matching the
 * `tenant-signup-verification`, `tenant-provisioning`, `tenant-resolver`,
 * and `auth` specs. Requires `docker compose up -d postgres` and
 * `apps/api/.env` to be set up first.
 *
 * SMTP is not configured in the test environment, so MailService logs the
 * verification link instead of sending it and the register response
 * includes the raw `verificationToken` (dev-only) for tests to consume.
 */
describe('Tenant lifecycle (e2e)', () => {
  let app: INestApplication;

  function uniqueSlug(prefix: string): string {
    return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
  }

  interface RegisteredTenant {
    id: string;
    slug: string;
    ownerEmail: string;
    ownerPassword: string;
  }

  async function registerPending(
    prefix: string,
  ): Promise<RegisteredTenant & { verificationToken: string }> {
    const slug = uniqueSlug(prefix);
    const ownerEmail = `owner@${slug}.test`;
    const ownerPassword = 'supersecret123';
    const res = await request(app.getHttpServer())
      .post('/tenants/register')
      .send({
        companyName: 'Acme Inc',
        slug,
        ownerEmail,
        ownerPassword,
        plan: 'BASIC',
      })
      .expect(201);
    expect(res.body.status).toBe('PENDING_VERIFICATION');
    expect(res.body.verificationToken).toBeDefined();
    return {
      id: res.body.id,
      slug,
      ownerEmail,
      ownerPassword,
      verificationToken: res.body.verificationToken,
    };
  }

  async function registerAndVerify(prefix: string): Promise<RegisteredTenant> {
    const pending = await registerPending(prefix);

    const verifyRes = await request(app.getHttpServer())
      .post('/tenants/verify-email')
      .send({ token: pending.verificationToken })
      .expect(201);
    expect(verifyRes.body.status).toBe('ACTIVE');

    return {
      id: pending.id,
      slug: pending.slug,
      ownerEmail: pending.ownerEmail,
      ownerPassword: pending.ownerPassword,
    };
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a tenant as PENDING_VERIFICATION, verifies, reaches ACTIVE, logs in, and reaches /me', async () => {
    const { id, slug, ownerEmail, ownerPassword } =
      await registerAndVerify('acme');

    const statusRes = await request(app.getHttpServer())
      .get(`/tenants/${id}/status`)
      .expect(200);
    expect(statusRes.body.status).toBe('ACTIVE');

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-tenant-slug', slug)
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(201);

    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.user.role).toBe('OWNER');

    const meRes = await request(app.getHttpServer())
      .get('/me')
      .set('x-tenant-slug', slug)
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);

    expect(meRes.body.tenant.slug).toBe(slug);
    expect(meRes.body.user.email).toBe(ownerEmail);
  });

  it('does not provision any tenant database while PENDING_VERIFICATION', async () => {
    const { slug } = await registerPending('pending');

    const dbName = `tenant_${slug.replace(/-/g, '_')}`;
    const { Client } = await import('pg');
    const client = new Client({
      host: process.env.TENANT_DB_HOST ?? 'localhost',
      port: Number(process.env.TENANT_DB_PORT ?? 55432),
      user: process.env.TENANT_DB_ADMIN_USER ?? 'saas',
      password: process.env.TENANT_DB_ADMIN_PASSWORD ?? 'saas_dev_password',
      database: process.env.TENANT_DB_MAINTENANCE_DATABASE ?? 'postgres',
    });
    await client.connect();
    const { rows } = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    await client.end();
    expect(rows).toHaveLength(0);
  });

  it('rejects registration with a duplicate slug', async () => {
    const slug = uniqueSlug('dup');
    await request(app.getHttpServer())
      .post('/tenants/register')
      .send({
        companyName: 'First',
        slug,
        ownerEmail: `a@${slug}.test`,
        ownerPassword: 'supersecret123',
        plan: 'BASIC',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/tenants/register')
      .send({
        companyName: 'Second',
        slug,
        ownerEmail: `b@${slug}.test`,
        ownerPassword: 'supersecret123',
        plan: 'BASIC',
      })
      .expect(409);
  });

  it('rejects registration with an invalid slug format', async () => {
    await request(app.getHttpServer())
      .post('/tenants/register')
      .send({
        companyName: 'Bad',
        slug: 'Not_Valid!',
        ownerEmail: 'bad@example.test',
        ownerPassword: 'supersecret123',
        plan: 'BASIC',
      })
      .expect(400);
  });

  it('rejects registration with a reserved slug', async () => {
    await request(app.getHttpServer())
      .post('/tenants/register')
      .send({
        companyName: 'Bad',
        slug: 'admin',
        ownerEmail: 'bad@example.test',
        ownerPassword: 'supersecret123',
        plan: 'BASIC',
      })
      .expect(400);
  });

  it('reports slug availability with reason codes', async () => {
    const slug = uniqueSlug('check');

    const available = await request(app.getHttpServer())
      .get(`/tenants/check-slug?slug=${slug}`)
      .expect(200);
    expect(available.body).toEqual({ available: true, reason: undefined });

    const invalid = await request(app.getHttpServer())
      .get('/tenants/check-slug?slug=Not_Valid!')
      .expect(200);
    expect(invalid.body).toEqual({ available: false, reason: 'invalid' });

    const reserved = await request(app.getHttpServer())
      .get('/tenants/check-slug?slug=www')
      .expect(200);
    expect(reserved.body).toEqual({ available: false, reason: 'reserved' });

    await request(app.getHttpServer())
      .post('/tenants/register')
      .send({
        companyName: 'Taken',
        slug,
        ownerEmail: `t@${slug}.test`,
        ownerPassword: 'supersecret123',
        plan: 'BASIC',
      })
      .expect(201);

    const taken = await request(app.getHttpServer())
      .get(`/tenants/check-slug?slug=${slug}`)
      .expect(200);
    expect(taken.body).toEqual({ available: false, reason: 'taken' });
  });

  it('rejects an invalid verification token', async () => {
    await request(app.getHttpServer())
      .post('/tenants/verify-email')
      .send({ token: crypto.randomBytes(32).toString('hex') })
      .expect(400);
  });

  it('rejects a replayed verification token', async () => {
    const regRes = await request(app.getHttpServer())
      .post('/tenants/register')
      .send({
        companyName: 'Replay',
        slug: uniqueSlug('replay'),
        ownerEmail: 'r@r.test',
        ownerPassword: 'supersecret123',
        plan: 'BASIC',
      })
      .expect(201);
    const token = regRes.body.verificationToken as string;

    await request(app.getHttpServer())
      .post('/tenants/verify-email')
      .send({ token })
      .expect(201);
    await request(app.getHttpServer())
      .post('/tenants/verify-email')
      .send({ token })
      .expect(400);
  });

  it('throttles resend-verification within 60 seconds', async () => {
    const { slug } = await registerPending('throttle');

    await request(app.getHttpServer())
      .post('/tenants/resend-verification-by-slug')
      .send({ slug })
      .expect(429);
  });

  it('rejects resend-verification for a non-pending tenant', async () => {
    const { slug } = await registerAndVerify('resentrant');

    await request(app.getHttpServer())
      .post('/tenants/resend-verification-by-slug')
      .send({ slug })
      .expect(400);
  });

  it('blocks staff login while the tenant is PENDING_VERIFICATION', async () => {
    const { slug, ownerEmail, ownerPassword } =
      await registerPending('blocked');

    await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-tenant-slug', slug)
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(503);
  });

  it('rejects requests to an unregistered tenant host', async () => {
    await request(app.getHttpServer())
      .get('/me')
      .set(
        'x-tenant-slug',
        `nonexistent-${crypto.randomBytes(4).toString('hex')}`,
      )
      .set('Authorization', 'Bearer bogus')
      .expect(404);
  });

  it('rejects a valid token for tenant A on a request that resolves to tenant B', async () => {
    const a = await registerAndVerify('tenant-a');
    const b = await registerAndVerify('tenant-b');

    const loginA = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-tenant-slug', a.slug)
      .send({ email: a.ownerEmail, password: a.ownerPassword })
      .expect(201);

    await request(app.getHttpServer())
      .get('/me')
      .set('x-tenant-slug', b.slug)
      .set('Authorization', `Bearer ${loginA.body.accessToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .get('/me')
      .set('x-tenant-slug', a.slug)
      .set('Authorization', `Bearer ${loginA.body.accessToken}`)
      .expect(200);
  });

  it('rotates and revokes refresh tokens', async () => {
    const { slug, ownerEmail, ownerPassword } =
      await registerAndVerify('refresh');

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-tenant-slug', slug)
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(201);

    const { refreshToken } = loginRes.body;

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('x-tenant-slug', slug)
      .send({ refreshToken })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('x-tenant-slug', slug)
      .send({ refreshToken })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('x-tenant-slug', slug)
      .send({ refreshToken })
      .expect(401);
  });
});
