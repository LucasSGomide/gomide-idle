import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { runMigrations } from '../../../src/modules/system/infrastructure/database/migrate.js';

export type WorkerDbType = {
  db: PostgresJsDatabase;
  sql: ReturnType<typeof postgres>;
  schema: string;
};

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is unset — the integration globalSetup did not run',
    );
  }
  return url;
}

export function workerSchemaName(
  id: string = process.env.JEST_WORKER_ID ?? '1',
): string {
  return `test_w${id}`;
}

// architecture-api.md rule 91: one container for the whole project (started in
// globalSetup), and each worker isolated by its own schema keyed off
// JEST_WORKER_ID. The schema under test is produced by running the project's own
// migrations into it (FR.15.2).
export async function setupWorkerSchema(
  id: string = process.env.JEST_WORKER_ID ?? '1',
): Promise<WorkerDbType> {
  const url = connectionString();
  const schema = workerSchemaName(id);

  const admin = postgres(url, { max: 1 });
  try {
    await admin.unsafe(`drop schema if exists "${schema}" cascade`);
    await admin.unsafe(`create schema "${schema}"`);
  } finally {
    await admin.end();
  }

  await runMigrations(url, { schema });

  const sql = postgres(url, {
    max: 1,
    connection: { options: `-c search_path="${schema}"` },
  });
  return { db: drizzle({ client: sql }), sql, schema };
}

export async function teardownWorkerSchema(
  worker: WorkerDbType,
): Promise<void> {
  await worker.sql.end();
  const admin = postgres(connectionString(), { max: 1 });
  try {
    await admin.unsafe(`drop schema if exists "${worker.schema}" cascade`);
  } finally {
    await admin.end();
  }
}
