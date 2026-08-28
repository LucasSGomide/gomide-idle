import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import semver from 'semver';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));

function readNearestPackageJson(fromEntry: string): Record<string, unknown> {
  let dir = dirname(fromEntry);
  while (!existsSync(join(dir, 'package.json'))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`no package.json above ${fromEntry}`);
    dir = parent;
  }
  return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as Record<
    string,
    unknown
  >;
}

const workspaceYaml = readFileSync(
  join(here, '..', '..', '..', 'pnpm-workspace.yaml'),
  'utf8',
);
const nestjsZod = readNearestPackageJson(require.resolve('nestjs-zod')) as {
  peerDependencies: Record<string, string>;
};

// stack-api.md rule 41: the peer override "asserts a compatibility nobody has
// verified, so anything overridden must be covered by a test that would fail if
// the assertion is wrong." The override tells pnpm @nestjs/swagger and
// @nestjs/common 12 satisfy nestjs-zod. That is safe only while nestjs-zod is
// still written against the 11 API — i.e. still declares an ^11 peer. The day it
// moves off ^11 the override is bridging from a surface that no longer exists,
// and a human has to re-check it rather than a machine assuming it holds.
describe('nestjs-zod peer override', () => {
  it('is declared in pnpm-workspace.yaml for both @nestjs peers', () => {
    expect(workspaceYaml).toMatch(/nestjs-zod>@nestjs\/common['"]?:\s*['"]?12/);
    expect(workspaceYaml).toMatch(
      /nestjs-zod>@nestjs\/swagger['"]?:\s*['"]?12/,
    );
  });

  it('still declares a @nestjs/swagger peer that admits the 11 line', () => {
    const declared = nestjsZod.peerDependencies['@nestjs/swagger'];
    if (declared === undefined)
      throw new Error('nestjs-zod dropped its @nestjs/swagger peer entirely');
    expect(semver.satisfies('11.999.999', declared)).toBe(true);
  });

  it('still declares a @nestjs/common peer that admits the 11 line', () => {
    const declared = nestjsZod.peerDependencies['@nestjs/common'];
    if (declared === undefined)
      throw new Error('nestjs-zod dropped its @nestjs/common peer entirely');
    expect(semver.satisfies('11.999.999', declared)).toBe(true);
  });
});
