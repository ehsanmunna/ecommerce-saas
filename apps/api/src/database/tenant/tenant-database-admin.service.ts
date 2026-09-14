import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'pg';

const VALID_DATABASE_NAME = /^[a-z][a-z0-9_]*$/;

@Injectable()
export class TenantDatabaseAdminService {
  private readonly logger = new Logger(TenantDatabaseAdminService.name);

  private async withMaintenanceClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
    const client = new Client({
      host: process.env.TENANT_DB_HOST ?? 'localhost',
      port: Number(process.env.TENANT_DB_PORT ?? 5432),
      user: process.env.TENANT_DB_ADMIN_USER,
      password: process.env.TENANT_DB_ADMIN_PASSWORD,
      database: process.env.TENANT_DB_MAINTENANCE_DATABASE ?? 'postgres',
    });
    await client.connect();
    try {
      return await fn(client);
    } finally {
      await client.end();
    }
  }

  /**
   * Database names are derived from validated tenant slugs, never taken
   * directly from a request. Postgres identifiers can't be parameterized,
   * so this check is defense in depth before any string interpolation.
   */
  private assertSafeDatabaseName(databaseName: string): void {
    if (!VALID_DATABASE_NAME.test(databaseName)) {
      throw new Error(`Refusing to operate on unsafe database name: ${databaseName}`);
    }
  }

  async createDatabase(databaseName: string): Promise<void> {
    this.assertSafeDatabaseName(databaseName);
    await this.withMaintenanceClient(async (client) => {
      const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
      if ((exists.rowCount ?? 0) > 0) {
        this.logger.warn(`Database "${databaseName}" already exists, skipping creation`);
        return;
      }
      await client.query(`CREATE DATABASE "${databaseName}"`);
    });
  }

  async dropDatabaseIfExists(databaseName: string): Promise<void> {
    this.assertSafeDatabaseName(databaseName);
    await this.withMaintenanceClient(async (client) => {
      await client.query(
        'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
        [databaseName],
      );
      await client.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
    });
  }
}
