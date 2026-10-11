import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class PlatformAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    let payload: Record<string, unknown>;
    try {
      payload = await this.jwtService.verifyAsync(header.slice(7), {
        secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
      });
    } catch {
      throw new UnauthorizedException('Token is invalid or expired');
    }
    if (payload.type !== 'platform') {
      throw new ForbiddenException('Token is not a platform token');
    }
    (req as Request & { platformAdmin?: unknown }).platformAdmin = payload;
    return true;
  }
}
