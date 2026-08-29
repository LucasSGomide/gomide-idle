import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ENV_KEYS, envSchema, loadEnv } from '../src/config/env.js';

const repoRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);

const validEnv = (): Record<string, string> => ({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://user:pass@127.0.0.1:5432/test',
});

describe('loadEnv', () => {
  it('parses a valid environment and applies the defaults', () => {
    expect(loadEnv(validEnv())).toEqual({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://user:pass@127.0.0.1:5432/test',
      PORT: 3000,
      HOST: '0.0.0.0',
      LOG_LEVEL: 'info',
      BUILD_ID: 'dev',
      AUTH_REGISTRATION_OPEN: true,
      SOCKET_ALLOWED_ORIGINS: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ],
      OBSERVE_SERVICE_ID: 'tormented-path-api',
    });
  });

  it('stops start-up with a message naming a missing required field', () => {
    expect(() => loadEnv({})).toThrow(/NODE_ENV/);
  });

  it('stops start-up with a message naming a malformed value', () => {
    expect(() => loadEnv({ ...validEnv(), PORT: 'not-a-number' })).toThrow(
      /PORT/,
    );
  });

  it('refuses a malformed registration switch (FR.5.2)', () => {
    expect(() =>
      loadEnv({ ...validEnv(), AUTH_REGISTRATION_OPEN: 'maybe' }),
    ).toThrow(/AUTH_REGISTRATION_OPEN/);
  });

  it('reads the registration switch as a boolean', () => {
    expect(
      loadEnv({ ...validEnv(), AUTH_REGISTRATION_OPEN: 'false' })
        .AUTH_REGISTRATION_OPEN,
    ).toBe(false);
  });
});

describe('.env.example (FR.14.2)', () => {
  const declared = new Set(
    readFileSync(join(repoRoot, '.env.example'), 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => line.split('=', 1)[0] ?? ''),
  );

  it.each(ENV_KEYS)('lists %s', (key) => {
    expect(declared.has(key)).toBe(true);
  });

  it('lists no variable the schema does not declare', () => {
    const schemaKeys = new Set<string>(Object.keys(envSchema.shape));
    for (const key of declared) {
      expect(schemaKeys.has(key)).toBe(true);
    }
  });
});
