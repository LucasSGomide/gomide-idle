import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const modulesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'modules',
);

const MODULES = ['auth', 'player', 'character', 'hunt', 'system'] as const;
const LAYERS = [
  'domain',
  'application',
  'infrastructure',
  'entrypoint',
] as const;

// FR.9.7 / architecture-api.md rule 19: five modules, each with the four layer
// folders.
describe('module structure', () => {
  it.each(MODULES)('%s has all four layer folders', (module) => {
    for (const layer of LAYERS) {
      expect(existsSync(join(modulesDir, module, layer))).toBe(true);
    }
  });
});
