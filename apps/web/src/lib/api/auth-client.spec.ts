import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import * as generated from './generated/tormented-path';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '..', '..');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

// task 06 AC5 / stack-web.md rules 57-59: each auth endpoint has a generated
// hook, client function and MSW handler — none hand-written.
describe('the generated auth client', () => {
  it.each([
    ['PostSignUp', 'useAuthControllerPostSignUp'],
    ['PostSignIn', 'useAuthControllerPostSignIn'],
    ['PostSignOut', 'useAuthControllerPostSignOut'],
    ['GetCurrentSession', 'useAuthControllerGetCurrentSession'],
  ])('%s has a hook, a client function and an MSW handler', (op, hook) => {
    const mod = generated as Record<string, unknown>;
    expect(typeof mod[hook]).toBe('function');
    expect(typeof mod[`authController${op}`]).toBe('function');
    expect(typeof mod[`getAuthController${op}MockHandler`]).toBe('function');
  });

  it('is imported through the single fetch mutator, never a bare fetch', () => {
    const client = readFileSync(
      join(here, 'generated', 'tormented-path.ts'),
      'utf8',
    );
    expect(client).toMatch(/from '\.\.\/fetcher/);
    expect(client).not.toMatch(/[^.\w]fetch\(/);
  });
});

// task 06 AC7 / stack-web.md rule 59: no Better Auth on the web, no hand-written
// auth request anywhere under src/.
describe('no Better Auth on the web', () => {
  const files = walk(srcDir).filter(
    (file) => /\.(ts|tsx)$/.test(file) && !file.includes(`${'generated'}`),
  );

  it('no src file imports better-auth', () => {
    const offenders = files.filter((file) =>
      /(from|import|require\()\s*['"]better-auth/.test(
        readFileSync(file, 'utf8'),
      ),
    );
    expect(offenders).toEqual([]);
  });

  it('no src file hand-writes an auth request (fetch to /auth or a raw client)', () => {
    const offenders = files.filter((file) => {
      if (file.endsWith('auth-client.spec.ts')) return false;
      const text = readFileSync(file, 'utf8');
      return /fetch\(\s*[`'"][^`'"]*\/auth\//.test(text);
    });
    expect(offenders).toEqual([]);
  });
});
