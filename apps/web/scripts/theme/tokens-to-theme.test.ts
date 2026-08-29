import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  flattenTokens,
  renderThemeCss,
  renderThemeTs,
  type TokenTree,
} from './tokens-to-theme.ts';

const here = dirname(fileURLToPath(import.meta.url));
const tokensPath = join(here, '..', '..', 'design-tokens.json');
const srcDir = join(here, '..', '..', 'src');

const tokens = JSON.parse(readFileSync(tokensPath, 'utf8')) as TokenTree;

function cssPropertyNames(css: string): string[] {
  return [...css.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((match) => match[1]!);
}

describe('the token generator', () => {
  // stack-web.md rule 45: the two documented mappings.
  it('maps color.accent.default to --color-accent', () => {
    const entries = flattenTokens({
      color: { accent: { default: '#A855F7' } },
    });
    expect(entries).toEqual([{ property: '--color-accent', value: '#A855F7' }]);
  });

  it('maps spacing.5 to --spacing-5', () => {
    const entries = flattenTokens({ spacing: { '5': '1.5rem' } });
    expect(entries).toEqual([{ property: '--spacing-5', value: '1.5rem' }]);
  });

  // task 02: theme.ts's exported names match the custom properties in theme.css.
  it('emits a theme.ts whose keys match the custom properties in theme.css', async () => {
    const css = renderThemeCss(tokens);
    const tsModule = (await import('../../src/theme.ts')) as {
      theme: Record<string, string>;
    };
    expect(Object.keys(tsModule.theme).sort()).toEqual(
      cssPropertyNames(css).sort(),
    );
  });

  // task 02: running the generator over the committed token file reproduces the
  // committed outputs exactly.
  it('reproduces the committed theme.css and theme.ts exactly', () => {
    expect(renderThemeCss(tokens)).toBe(
      readFileSync(join(srcDir, 'theme.css'), 'utf8'),
    );
    expect(renderThemeTs(tokens)).toBe(
      readFileSync(join(srcDir, 'theme.ts'), 'utf8'),
    );
  });

  // stack-web.md rule 54: hex colours also come out as 0x integers for PixiJS.
  it('converts hex colours to 0x integers in themeColorHex', async () => {
    const tsModule = (await import('../../src/theme.ts')) as {
      themeColorHex: Record<string, number>;
    };
    expect(tsModule.themeColorHex['--color-damage-type-fire']).toBe(0xf97316);
    expect(tsModule.themeColorHex['--color-accent']).toBe(0xa855f7);
    // An rgba() token is not a plain hex, so it is not in the numeric map.
    expect(tsModule.themeColorHex['--color-accent-muted']).toBeUndefined();
  });
});
