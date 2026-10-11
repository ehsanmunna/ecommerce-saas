import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { execSync } from 'node:child_process';
import * as path from 'node:path';
import { PrismaClient } from '@prisma-clients/platform';

@Injectable()
export class PlatformPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PlatformPrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      const schemaPath = path.resolve(
        process.cwd(),
        '../../prisma/platform/schema.prisma',
      );
      execSync(`npx prisma migrate deploy --schema=${schemaPath}`, {
        stdio: 'inherit',
      });
      this.logger.log('Platform database migrations applied');
    } catch (error) {
      this.logger.error('Platform database migration failed', error);
    }
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
