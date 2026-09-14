import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'node:crypto';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Integration tests against a real Postgres instance (see
 * apps/api/.env.example / docker-compose.yml) - registration and
 * provisioning genuinely create and migrate databases, matching the
 * `tenant-registration`, `tenant-provisioning`, `tenant-resolver`, and
 * `auth` specs. Requires `docker compose up -d postgres` and
 * `apps/api/.env` to be set up first.
 */
describe('Tenant lifecycle (e2e)', () => {
  let app: INestApplication;

  function uniqueSlug(prefix: string): string {
    return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a tenant, reaches ACTIVE, logs in, and reaches /me with the right tenant context', async () => {
    const slug = uniqueSlug('acme');

    const registerRes = await request(app.getHttpServer())
      .post('/tenants/register')
      .send({ companyName: 'Acme Inc', slug, ownerEmail: `owner@${slug}.test`, ownerPassword: 'supersecret123', plan: 'BASIC' })
      .expect(201);

    expect(registerRes.body.status).toBe('ACTIVE');

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-tenant-slug', slug)
      .send({ email: `owner@${slug}.test`, password: 'supersecret123' })
      .expect(201);

    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.user.role).toBe('OWNER');

    const meRes = await request(app.getHttpServer())
      .get('/me')
      .set('x-tenant-slug', slug)
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);

    expect(meRes.body.tenant.slug).toBe(slug);
    expect(meRes.body.user.email).toBe(`owner@${slug}.test`);
  });

  it('rejects registration with a duplicate slug', async () => {
    const slug = uniqueSlug('dup');
    await request(app.getHttpServer())
      .post('/tenants/register')
      .send({ companyName: 'First', slug, ownerEmail: `a@${slug}.test`, ownerPassword: 'supersecret123', plan: 'BASIC' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/tenants/register')
      .send({ companyName: 'Second', slug, ownerEmail: `b@${slug}.test`, ownerPassword: 'supersecret123', plan: 'BASIC' })
      .expect(409);
  });

  it('rejects registration with an invalid slug format', async () => {
    await request(app.getHttpServer())
      .post('/tenants/register')
      .send({ companyName: 'Bad', slug: 'Not_Valid!', ownerEmail: 'bad@example.test', ownerPassword: 'supersecret123', plan: 'BASIC' })
      .expect(400);
  });

  it('rejects requests to an unregistered tenant host', async () => {
    await request(app.getHttpServer())
      .get('/me')
      .set('x-tenant-slug', `nonexistent-${crypto.randomBytes(4).toString('hex')}`)
      .set('Authorization', 'Bearer bogus')
      .expect(404);
  });

  it('rejects a valid token for tenant A on a request that resolves to tenant B', async () => {
    const slugA = uniqueSlug('tenant-a');
    const slugB = uniqueSlug('tenant-b');

    await request(app.getHttpServer())
      .post('/tenants/register')
      .send({ companyName: 'Tenant A', slug: slugA, ownerEmail: `owner@${slugA}.test`, ownerPassword: 'supersecret123', plan: 'BASIC' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/tenants/register')
      .send({ companyName: 'Tenant B', slug: slugB, ownerEmail: `owner@${slugB}.test`, ownerPassword: 'supersecret123', plan: 'BASIC' })
      .expect(201);

    const loginA = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-tenant-slug', slugA)
      .send({ email: `owner@${slugA}.test`, password: 'supersecret123' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/me')
      .set('x-tenant-slug', slugB)
      .set('Authorization', `Bearer ${loginA.body.accessToken}`)
      .expect(401);

    // The same token still works against its own tenant.
    await request(app.getHttpServer())
      .get('/me')
      .set('x-tenant-slug', slugA)
      .set('Authorization', `Bearer ${loginA.body.accessToken}`)
      .expect(200);
  });

  it('rotates and revokes refresh tokens', async () => {
    const slug = uniqueSlug('refresh');
    await request(app.getHttpServer())
      .post('/tenants/register')
      .send({ companyName: 'Refresh Co', slug, ownerEmail: `owner@${slug}.test`, ownerPassword: 'supersecret123', plan: 'BASIC' })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-tenant-slug', slug)
      .send({ email: `owner@${slug}.test`, password: 'supersecret123' })
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
