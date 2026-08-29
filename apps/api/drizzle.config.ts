import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { defineConfig } from 'drizzle-kit';

// stack-api.md rule 17: drizzle-kit owns every migration in the repo. v1's
// timestamped migration folders are the format a greenfield repo starts on.

// `drizzle-kit studio` connects, so it needs DATABASE_URL — and unlike the
// `db:migrate` script it is a binary, with no `--env-file` of its own. The
// package scripts run with the cwd at apps/api, so the repo-root .env is two
// levels up; Node 24 reads it without a dotenv dependency.
const rootEnv = resolve(process.cwd(), '..', '..', '.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

export default defineConfig({
  dialect: 'postgresql',
  // Every module keeps its Drizzle tables in infrastructure/database/schema/.
  // The auth module's file there is Better Auth's generated output (auth.md
  // rule 5); drizzle-kit diffs and applies it alongside the game tables.
  schema: './src/modules/*/infrastructure/database/schema/*.schema.ts',
  out: './migrations',
  dbCredentials: {
    // `drizzle-kit generate` only diffs schema files and never opens a
    // connection, so it must keep working with no .env present. The placeholder
    // names itself, so a `studio` run without DATABASE_URL fails with the reason
    // in the hostname rather than a bare ECONNREFUSED.
    url:
      process.env.DATABASE_URL ?? 'postgres://database-url-not-set:5432/unset',
  },
});
