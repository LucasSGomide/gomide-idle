import { loadEnv, type EnvType } from '../../src/config/env.js';

// A valid environment for tests that boot the app but never touch the database.
// The integration harness overwrites process.env.DATABASE_URL with a live
// container URL; unit tests get a placeholder (postgres.js connects lazily).
export function makeTestEnv(
  overrides: Record<string, string | undefined> = {},
): EnvType {
  return loadEnv({
    NODE_ENV: 'test',
    DATABASE_URL:
      process.env.DATABASE_URL ?? 'postgres://user:pass@127.0.0.1:5432/test',
    ...overrides,
  });
}
