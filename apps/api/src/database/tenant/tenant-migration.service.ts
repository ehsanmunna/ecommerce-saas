import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'node:child_process';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

@Injectable()
export class TenantMigrationService {
  private readonly logger = new Logger(TenantMigrationService.name);
  private readonly schemaPath = path.resolve(
    process.cwd(),
    '../../prisma/tenant/schema.prisma',
  );

  async deploy(tenantDatabaseUrl: string): Promise<void> {
    this.logger.log(
      `Deploying tenant schema migrations (schema: ${this.schemaPath})`,
    );
    // Windows requires shell:true to spawn the .cmd shim npx resolves to;
    // without it, launching npx.cmd directly fails with "spawn EINVAL".
    await execFileAsync(
      'npx',
      ['prisma', 'migrate', 'deploy', `--schema=${this.schemaPath}`],
      {
        env: { ...process.env, TENANT_DATABASE_URL: tenantDatabaseUrl },
        shell: true,
      },
    );
  }
}
