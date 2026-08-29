import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { ACTIVE_SEASON, GAME_NAME } from './brand';

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'generated' ? [] : sourceFiles(full);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

// naming.md rule 16: each string is written in exactly one place — the brand
// module — and never retyped as a literal anywhere else, so a season swap is one
// edit.
describe('the brand strings are single-sourced', () => {
  it.each([GAME_NAME, ACTIVE_SEASON])(
    '"%s" appears as a literal only in brand.ts',
    (value) => {
      const offenders = sourceFiles(srcDir)
        .filter((file) => !file.endsWith(`${join('lib', 'brand.ts')}`))
        .filter((file) => !/\.(test|spec)\.tsx?$/.test(file))
        .filter((file) => readFileSync(file, 'utf8').includes(value))
        .map((file) => relative(srcDir, file));
      expect(offenders).toEqual([]);
    },
  );
});
