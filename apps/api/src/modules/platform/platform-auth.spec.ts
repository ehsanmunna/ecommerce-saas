import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PlatformAuthGuard } from './platform-auth.guard';
import { PlatformAuthService } from './platform-auth.service';

describe('PlatformAuthService.login', () => {
  const jwtService = new JwtService();
  let prisma: { platformAdmin: { findUnique: jest.Mock } };
  let service: PlatformAuthService;

  beforeEach(() => {
    prisma = { platformAdmin: { findUnique: jest.fn() } };
    service = new PlatformAuthService(prisma as never, jwtService);
  });

  it('returns a platform-scoped token on valid credentials', async () => {
    const passwordHash = await bcrypt.hash('hunter2hunter2', 10);
    prisma.platformAdmin.findUnique.mockResolvedValue({
      id: 'admin-1',
      email: 'ops@example.com',
      passwordHash,
    });
    const result = await service.login('ops@example.com', 'hunter2hunter2');
    expect(result.accessToken).toBeTruthy();
    const decoded = jwtService.decode(result.accessToken);
    expect(decoded.type).toBe('platform');
    expect(decoded.sub).toBe('admin-1');
  });

  it('rejects invalid credentials', async () => {
    prisma.platformAdmin.findUnique.mockResolvedValue(null);
    await expect(service.login('x@y.z', 'nope')).rejects.toThrow(
      'Invalid credentials',
    );
  });
});

describe('PlatformAuthGuard', () => {
  const jwtService = new JwtService();
  const guard = new PlatformAuthGuard(jwtService);
  const ctxFor = (req: object) =>
    ({
      switchToHttp: () => ({ getRequest: () => req }),
    }) as never;

  const sign = (payload: object) =>
    jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
    });

  it('rejects requests without a bearer token', async () => {
    await expect(guard.canActivate(ctxFor({ headers: {} }))).rejects.toThrow(
      'Missing bearer token',
    );
  });

  it('rejects staff tokens', async () => {
    const token = sign({
      sub: 'u1',
      tenantId: 't1',
      role: 'OWNER',
      type: 'staff',
    });
    await expect(
      guard.canActivate(
        ctxFor({ headers: { authorization: `Bearer ${token}` } }),
      ),
    ).rejects.toThrow('Token is not a platform token');
  });

  it('accepts platform tokens', async () => {
    const token = sign({
      sub: 'a1',
      email: 'ops@example.com',
      type: 'platform',
    });
    await expect(
      guard.canActivate(
        ctxFor({ headers: { authorization: `Bearer ${token}` } }),
      ),
    ).resolves.toBe(true);
  });
});
