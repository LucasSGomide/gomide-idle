import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { jest } from '@jest/globals';

jest.setTimeout(60_000);

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const committedPath = join(apiRoot, 'openapi.json');

function regenerate(): string {
  const out = join(mkdtempSync(join(tmpdir(), 'openapi-')), 'openapi.json');
  execFileSync(
    process.execPath,
    ['--import', 'tsx', join(apiRoot, 'scripts', 'generate-openapi.ts')],
    {
      cwd: apiRoot,
      encoding: 'utf8',
      // FR.11.2 / AC1: no real database is reachable at this URL. If generation
      // connected to one it would hang or fail here rather than finish.
      env: {
        ...process.env,
        OPENAPI_OUT: out,
        DATABASE_URL: 'postgres://nope:1/x',
      },
    },
  );
  return readFileSync(out, 'utf8');
}

describe('the OpenAPI document (UN.11, FR.11.2, FR.11.5)', () => {
  it('generates with no port opened and no database connected', () => {
    const regenerated = regenerate();
    expect(regenerated).toContain('"openapi"');
  });

  it('the committed document is byte-identical to a fresh generation', () => {
    expect(regenerate()).toBe(readFileSync(committedPath, 'utf8'));
  });

  it('every reusable schema carries an explicit name, none named after its position', () => {
    const doc = JSON.parse(readFileSync(committedPath, 'utf8')) as {
      components?: { schemas?: Record<string, unknown> };
    };
    const names = Object.keys(doc.components?.schemas ?? {});
    expect(names).toContain('ServerMetaResponse');
    for (const name of names) {
      expect(name).not.toMatch(/(_\d+|^Schema\d|Response_|Class\d)/);
    }
  });
});
