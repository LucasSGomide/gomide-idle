import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  renderThemeCss,
  renderThemeTs,
  type TokenTree,
} from './theme/tokens-to-theme.ts';

// stack-web.md rules 45 and 54: one generator, two committed outputs. The input
// is apps/web/design-tokens.json (design.md declares it the source of truth);
// the outputs are apps/web/src/theme.css and apps/web/src/theme.ts, both
// drift-checked in CI (FR.16.1).

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const tokensPath = join(here, '..', 'design-tokens.json');
const cssPath = join(here, '..', 'src', 'theme.css');
const tsPath = join(here, '..', 'src', 'theme.ts');

const tokens = JSON.parse(readFileSync(tokensPath, 'utf8')) as TokenTree;

writeFileSync(cssPath, renderThemeCss(tokens));
writeFileSync(tsPath, renderThemeTs(tokens));

process.stdout.write(
  `theme.css and theme.ts regenerated from ${tokensPath.replace(`${repoRoot}/`, '')}\n`,
);
