import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);

function gitIgnores(path: string): boolean {
  try {
    execFileSync('git', ['check-ignore', '-q', '--', path], { cwd: repoRoot });
    return true;
  } catch {
    return false;
  }
}

// FR.14.2: no file holding real environment values is ever committed. Every env
// file but the example must be excluded by the ignore rules.
describe('environment files are not committed', () => {
  it.each(['.env', '.env.local', '.env.test', '.env.production', '.env.ci'])(
    'ignores %s',
    (file) => {
      expect(gitIgnores(file)).toBe(true);
    },
  );

  it('tracks .env.example', () => {
    expect(gitIgnores('.env.example')).toBe(false);
  });
});
