import { readdirSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findConstructedLoggers } from './support/logger-usage.js';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '..', 'src');
const fixtureDir = join(here, 'fixtures', 'logging');

// The logging module builds the one pino instance; everywhere else the logger is
// injected.
const isLoggingModule = (fullPath: string): boolean =>
  fullPath.includes(`${sep}logging${sep}`);

describe('the logger is injected, not constructed (architecture-api.md rule 48)', () => {
  it('src contains no constructed logger and no console call outside the logging module', () => {
    expect(findConstructedLoggers(srcDir, isLoggingModule)).toEqual([]);
  });

  it('flags a logger constructed inside a use case', () => {
    // sanity: the fixture is where the test expects it
    expect(readdirSync(fixtureDir)).toContain('bad-use-case.ts');
    const found = findConstructedLoggers(fixtureDir);
    expect(found.map((violation) => violation.pattern)).toContain(
      'new Logger()',
    );
  });
});
