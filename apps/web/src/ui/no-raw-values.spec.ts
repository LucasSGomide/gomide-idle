import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const uiDir = dirname(fileURLToPath(import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(full);
    }
    if (!/\.tsx?$/.test(entry.name)) {
      return [];
    }
    if (/\.(test|spec)\.tsx?$/.test(entry.name)) {
      return [];
    }
    return [full];
  });
}

// stack-web.md rule 46 / FR.16.1: no file under ui/ contains a raw colour, size,
// radius or duration — every value comes from the generated theme's utilities.
const RAW_VALUE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'hex colour', pattern: /#[0-9a-fA-F]{3,8}\b/ },
  { label: 'rgb/rgba/hsl colour', pattern: /\b(?:rgba?|hsla?)\s*\(/ },
  { label: 'pixel length', pattern: /\b\d+(?:\.\d+)?px\b/ },
  { label: 'rem length', pattern: /\b\d+(?:\.\d+)?rem\b/ },
  { label: 'millisecond duration', pattern: /\b\d+ms\b/ },
];

describe('ui/ primitives carry no raw design values', () => {
  it.each(sourceFiles(uiDir).map((file) => [file] as const))('%s', (file) => {
    const source = readFileSync(file, 'utf8');
    for (const { label, pattern } of RAW_VALUE_PATTERNS) {
      expect(pattern.test(source), `${file} contains a raw ${label}`).toBe(
        false,
      );
    }
  });
});
