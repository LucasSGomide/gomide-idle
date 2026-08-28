import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const depcruise = join(apiRoot, 'node_modules', '.bin', 'depcruise');

// Shell out to the same binary CI runs rather than importing dependency-cruiser
// into Jest's ESM loader (which cannot resolve its `#report` subpath imports).
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
      { cwd: apiRoot, encoding: 'utf8' },
    );
  } catch (error) {
    // depcruise exits non-zero on violations; the JSON report is still on stdout.
    stdout = (error as { stdout?: string }).stdout ?? '';
  }
  const report = JSON.parse(stdout) as {
    summary: { violations: Array<{ rule: { name: string } }> };
  };
  return new Set(report.summary.violations.map((violation) => violation.rule.name));
}

// stack-api.md rule 42 / FR.12.2: the boundary check catches what neither linter
// can state. Each fixture breaks exactly one rule in the project's own ruleset.
describe('the dependency-cruiser boundary check', () => {
  it('fails on an import from domain/ into infrastructure/', () => {
    expect(rulesTriggeredBy('modules/alpha/domain/reaches-infra.ts')).toContain(
      'domain-imports-inward-only',
    );
  });

  it('fails on an import from one module into a sibling module', () => {
    expect(
      rulesTriggeredBy('modules/alpha/entrypoint/reaches-sibling.ts'),
    ).toContain('no-sibling-module-import');
  });

  it('fails on a NestJS import inside domain/ (architecture-api.md rule 20)', () => {
    expect(rulesTriggeredBy('modules/alpha/domain/imports-nestjs.ts')).toContain(
      'domain-free-of-frameworks',
    );
  });

  it('fails on an outward import written as type-only (FR.12.3)', () => {
    expect(
      rulesTriggeredBy('modules/alpha/application/type-only-outward.ts'),
    ).toContain('application-imports-inward-only');
  });
});
