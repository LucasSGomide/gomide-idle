import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// apps/api/migrations — drizzle-kit owns every file in it (stack-api.md rule 17).
export const migrationsFolder = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  '..',
  'migrations',
);

// Runs the committed migrations against a connection. Used by the db:migrate
// script and by the Jest integration harness (FR.15.2: tests apply the project's
// own migrations rather than creating tables themselves).
export async function runMigrations(
  connectionString: string,
  options: { schema?: string } = {},
): Promise<void> {
  const client = postgres(connectionString, {
    max: 1,
    ...(options.schema
      ? { connection: { options: `-c search_path="${options.schema}"` } }
      : {}),
  });
  try {
    await migrate(drizzle({ client }), {
      migrationsFolder,
      ...(options.schema ? { migrationsSchema: options.schema } : {}),
    });
  } finally {
    await client.end();
  }
}
