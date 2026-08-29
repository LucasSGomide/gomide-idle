import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

async function loadStylesheet(id: string, base: string) {
  let path: string;
  if (id === 'tailwindcss') {
    path = require.resolve('tailwindcss/index.css');
  } else if (id.startsWith('tailwindcss/')) {
    path = require.resolve(id);
  } else {
    path = resolve(base, id);
  }
  return { base: dirname(path), content: readFileSync(path, 'utf8'), path };
}

// task 02: a Tailwind utility resolves to a generated custom property in the
// built CSS — proving the theme the generator emits is the theme Tailwind v4
// compiles against.
describe('Tailwind v4 over the generated theme', () => {
  it('resolves utilities to the generated custom properties', async () => {
    const compiler = await compile(
      `@import 'tailwindcss';\n@import './theme.css';`,
      {
        base: srcDir,
        loadStylesheet,
        loadModule: async () => {
          throw new Error('no @plugin / @config expected');
        },
      },
    );

    const css = compiler.build([
      'text-accent',
      'bg-surface',
      'p-5',
      'rounded-md',
      'duration-fast',
    ]);

    // The generated properties are in the compiled output...
    expect(css).toContain('--color-accent: #A855F7');
    expect(css).toContain('--spacing-5: 1.5rem');

    // ...and the utilities reference them.
    expect(css).toMatch(/\.text-accent\s*\{[^}]*--color-accent/);
    expect(css).toMatch(/\.bg-surface\s*\{[^}]*--color-surface/);
    expect(css).toMatch(/\.p-5\s*\{[^}]*--spacing-5/);
  });
});
