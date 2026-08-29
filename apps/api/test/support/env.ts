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
    // Nest's boot output now goes through pino rather than being discarded, so
    // an app booted by a test would print its whole route map into the runner.
    // A test that asserts on log lines builds its own root logger at an explicit
    // level (log-shape.spec.ts), so silencing the default costs no coverage.
    LOG_LEVEL: 'silent',
    ...overrides,
  });
}
