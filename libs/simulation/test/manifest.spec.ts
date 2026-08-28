import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const manifest = require('../package.json') as Record<string, unknown>;

describe('libs/simulation manifest', () => {
  // FR.9.2 / architecture-api.md rule 9: the package declares no runtime
  // dependency at all. This test fails the moment a `dependencies` entry is
  // added, so the rule is machine-enforced and not a habit.
  it('declares no runtime dependencies', () => {
    expect(manifest.dependencies).toBeUndefined();
  });
});
