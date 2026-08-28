import { resolveBuildId } from '../src/modules/system/application/resolve-build-id.js';

// Roadmap 01 open decision: the reported build id identifies the running build,
// not the moment the first migration ran.
describe('resolveBuildId', () => {
  it('reports the running build id from the environment over the seeded placeholder', () => {
    expect(resolveBuildId('a1b2c3d', 'unknown')).toBe('a1b2c3d');
  });

  it('falls back to the seeded column only for a bare local run', () => {
    expect(resolveBuildId(undefined, 'unknown')).toBe('unknown');
    expect(resolveBuildId('dev', '0.1.0-seed')).toBe('0.1.0-seed');
  });
});
