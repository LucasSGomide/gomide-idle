import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { jest } from '@jest/globals';

jest.setTimeout(60_000);

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const committedPath = join(
  apiRoot,
  'src/modules/auth/infrastructure/database/schema/auth.schema.ts',
);

function regenerate(): string {
  const out = join(
    mkdtempSync(join(tmpdir(), 'auth-schema-')),
    'auth.schema.ts',
  );
  execFileSync(
    process.execPath,
    ['--import', 'tsx', join(apiRoot, 'scripts', 'generate-auth-schema.ts')],
    {
      cwd: apiRoot,
      encoding: 'utf8',
      env: { ...process.env, AUTH_SCHEMA_OUT: out },
    },
  );
  return readFileSync(out, 'utf8');
}

// auth.md rule 5 / task 01 AC2: `make api-auth-schema` regenerates the committed
// file byte-identical, so the drift check in `make check` holds.
describe('the Better Auth generated schema (auth.md rule 5)', () => {
  it('regenerates byte-identical to the committed file', () => {
    expect(regenerate()).toBe(readFileSync(committedPath, 'utf8'));
  });

  it('declares the four tables Better Auth owns', () => {
    const committed = readFileSync(committedPath, 'utf8');
    for (const table of ['user', 'session', 'account', 'verification']) {
      expect(committed).toMatch(
        new RegExp(`export const ${table} = pgTable\\(\\s*'${table}'`),
      );
    }
  });
});
