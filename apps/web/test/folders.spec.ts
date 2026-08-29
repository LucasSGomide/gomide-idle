import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

// architecture-web.md rule 6: src/ gets exactly these six folders.
const FOLDERS = [
  'routes',
  'features',
  'renderer',
  'transport',
  'ui',
  'lib',
] as const;

describe('the six-folder source tree', () => {
  it.each(FOLDERS)('has src/%s', (folder) => {
    expect(existsSync(join(srcDir, folder))).toBe(true);
  });
});
