import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { theme } from '../../theme.ts';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// FR.16.3: both interface fonts load with a declared fallback stack and swap in
// without a flash of invisible text.
describe('font loading', () => {
  const html = readFileSync(join(webRoot, 'index.html'), 'utf8');

  it('loads both faces through one fonts.googleapis.com stylesheet with display=swap', () => {
    const stylesheets = [
      ...html.matchAll(/<link[^>]*fonts\.googleapis\.com\/css2[^>]*>/g),
    ];
    expect(stylesheets).toHaveLength(1);
    const link = stylesheets[0]![0];
    expect(link).toMatch(/rel="stylesheet"/);
    expect(link).toMatch(/display=swap/);
    expect(link).toMatch(/family=Inter/);
    expect(link).toMatch(/family=Rajdhani/);
  });

  it('declares a fallback stack ending in a generic family for both faces', () => {
    for (const property of ['--font-display', '--font-body'] as const) {
      const stack = theme[property];
      expect(stack).toContain(',');
      expect(stack).toMatch(/sans-serif\s*$/);
    }
  });
});
