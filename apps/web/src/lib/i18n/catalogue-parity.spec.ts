import { describe, expect, it } from 'vitest';

import { en } from './en';
import { pt } from './pt';

// task 08 AC9 / stack-web.md rule 50: every English key exists in Portuguese.
// `pt satisfies typeof en` already enforces this at compile time; this is the
// runtime twin, so a reviewer sees it green.
function keyPaths(value: unknown, prefix = ''): string[] {
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      keyPaths(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [prefix];
}

describe('the catalogues', () => {
  it('cover the same key paths in English and Portuguese', () => {
    expect(keyPaths(pt).sort()).toEqual(keyPaths(en).sort());
  });

  it('carry the four auth error codes in both languages', () => {
    for (const code of [
      'EMAIL_TAKEN',
      'INVALID_CREDENTIALS',
      'TOO_MANY_ATTEMPTS',
      'REGISTRATION_CLOSED',
    ] as const) {
      expect(typeof en.errors[code]).toBe('string');
      expect(typeof pt.errors[code]).toBe('string');
    }
  });
});
