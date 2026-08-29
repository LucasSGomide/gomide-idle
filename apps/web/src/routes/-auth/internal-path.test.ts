import { describe, expect, it } from 'vitest';

import { toInternalPath } from './internal-path';

// task 08 AC2: the `redirect` target is validated as an internal path, never
// trusted, so it cannot become an open redirect.
describe('toInternalPath', () => {
  it('keeps a same-origin absolute path', () => {
    expect(toInternalPath('/characters')).toBe('/characters');
    expect(toInternalPath('/characters/42/gear')).toBe('/characters/42/gear');
  });

  it('falls back to /characters when the target is missing or not an internal path', () => {
    expect(toInternalPath(undefined)).toBe('/characters');
    expect(toInternalPath('')).toBe('/characters');
    expect(toInternalPath('characters')).toBe('/characters');
    expect(toInternalPath('//evil.example/phish')).toBe('/characters');
    expect(toInternalPath('https://evil.example')).toBe('/characters');
    expect(toInternalPath('javascript:alert(1)')).toBe('/characters');
    expect(toInternalPath('/\\evil')).toBe('/characters');
  });
});
