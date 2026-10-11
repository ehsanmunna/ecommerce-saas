/* eslint-disable no-console */
import 'dotenv/config';
import { Client } from 'pg';
import * as path from 'node:path';
import * as fs from 'node:fs';

const KEEP = new Set(['tenant_diu']);

async function main() {
  const yes = process.argv.includes('--yes');

  // Load apps/api/.env for TENANT_DB_* and PLATFORM_DATABASE_URL
  const envPath = path.resolve(__dirname, '../apps/api/.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
      }
    }
  }

  const admin = new Client({
    host: process.env.TENANT_DB_HOST ?? 'localhost',
    port: Number(process.env.TENANT_DB_PORT ?? 5432),
    user: process.env.TENANT_DB_ADMIN_USER,
    password: process.env.TENANT_DB_ADMIN_PASSWORD,
    database: process.env.TENANT_DB_MAINTENANCE_DATABASE ?? 'platform',
  });
  await admin.connect();

  const { rows } = await admin.query<{ datname: string }>(
    "SELECT datname FROM pg_database WHERE datname LIKE 'tenant\\_%' ESCAPE '\\'",
  );
  const toDrop = rows.map((r) => r.datname).filter((n) => !KEEP.has(n));
  console.log(`Tenant databases found: ${rows.map((r) => r.datname).join(', ') || '(none)'}`);
  console.log(`Will drop: ${toDrop.join(', ') || '(none)'}`);
  console.log(`Will keep: ${[...KEEP].join(', ')}`);

  if (!yes) {
    console.log('Dry run. Re-run with --yes to execute.');
    await admin.end();
    return;
  }

  for (const name of toDrop) {
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      throw new Error(`Unsafe database name: ${name}`);
    }
    console.log(`Dropping ${name}...`);
    await admin.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [name],
    );
    await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
  }
  await admin.end();

  const platformUrl = process.env.PLATFORM_DATABASE_URL;
  if (platformUrl && toDrop.length > 0) {
    const platform = new Client({ connectionString: platformUrl });
    await platform.connect();
    const res = await platform.query(
      'DELETE FROM "tenants" WHERE database_name = ANY($1)',
      [toDrop],
    );
    console.log(`Removed ${res.rowCount} tenant registry rows.`);
    await platform.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
