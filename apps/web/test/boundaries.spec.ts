import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const depcruise = join(webRoot, 'node_modules', '.bin', 'depcruise');

// Shell out to the same binary CI runs rather than importing dependency-cruiser
// into Vitest's loader.
function rulesTriggeredBy(relEntry: string): Set<string> {
  let stdout: string;
  try {
    stdout = execFileSync(
      depcruise,
      [
        '--config',
        '.dependency-cruiser.cjs',
        '--output-type',
        'json',
        join('test/fixtures/boundaries', relEntry),
      ],
      { cwd: webRoot, encoding: 'utf8' },
    );
  } catch (error) {
    // depcruise exits non-zero on violations; the JSON report is still on stdout.
    stdout = (error as { stdout?: string }).stdout ?? '';
  }
  const report = JSON.parse(stdout) as {
    summary: { violations: Array<{ rule: { name: string } }> };
  };
  return new Set(
    report.summary.violations.map((violation) => violation.rule.name),
  );
}

// stack-web.md rule 60 / FR.12.2: each fixture breaks exactly one rule in the
// project's own ruleset.
describe('the dependency-cruiser boundary check', () => {
  it('passes on the empty six-folder tree', () => {
    let threw = false;
    try {
      execFileSync(
        depcruise,
        ['--config', '.dependency-cruiser.cjs', '--output-type', 'err', 'src'],
        { cwd: webRoot, encoding: 'utf8' },
      );
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });

  it('fails when a file in one feature imports from a sibling feature', () => {
    expect(rulesTriggeredBy('features/alpha/imports-sibling.ts')).toContain(
      'no-cross-feature-import',
    );
  });

  it('fails when a file in ui/ imports from features/', () => {
    expect(rulesTriggeredBy('ui/imports-feature.ts')).toContain(
      'ui-knows-no-feature',
    );
  });

  it('fails on an import into renderer/ that is not the generated theme module', () => {
    expect(rulesTriggeredBy('renderer/imports-lib.ts')).toContain(
      'renderer-admits-only-the-theme-module',
    );
  });

  it('fails on a seventh folder added under the source root', () => {
    expect(rulesTriggeredBy('seventh/thing.ts')).toContain(
      'no-folder-beside-the-six',
    );
  });

  it('fails when a file outside transport/ imports Socket.IO', () => {
    expect(rulesTriggeredBy('features/alpha/imports-socket.ts')).toContain(
      'socket-io-only-in-transport',
    );
  });

  it('allows transport/ to import Socket.IO', () => {
    expect(rulesTriggeredBy('transport/uses-socket.ts')).not.toContain(
      'socket-io-only-in-transport',
    );
  });

  it('allows a feature to import from lib/', () => {
    const triggered = rulesTriggeredBy('features/alpha/imports-ok.ts');
    expect(triggered.size).toBe(0);
  });
});
