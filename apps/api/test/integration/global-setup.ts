import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

import { POSTGRES_IMAGE } from './support/postgres.ts';

// Loaded by Node directly (outside Jest's module runtime), so this file imports
// only npm packages and a sibling with an explicit .ts specifier — no `src/`
// import, whose `.js` specifiers Jest's moduleNameMapper would have to rewrite.
const migrationsFolder = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'migrations',
);

// architecture-api.md rule 91: one container per Jest project, started here in
// globalSetup (its own process). The connection string reaches the tests through
// the environment, not an import. No .withReuse().
export default async function globalSetup(): Promise<void> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  const url = container.getConnectionUri();

  // FR.15.2 / AC9: a broken migration fails the integration run right here.
  const client = postgres(url, { max: 1 });
  try {
    await migrate(drizzle({ client }), { migrationsFolder });
  } finally {
    await client.end();
  }

  process.env.DATABASE_URL = url;
  (globalThis as Record<string, unknown>).__PG_CONTAINER__ = container;
}
