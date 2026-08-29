import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { filesMatching } from './support/scan.js';

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const authModuleDir = `${sep}modules${sep}auth${sep}`;

// auth.md rule 1 / task 01 AC7: every `better-auth` import stays inside
// apps/api/src/modules/auth, so an upgrade or a swap is one folder. Checked the
// way test/module-structure.spec.ts checks the other boundaries — by scanning
// the tree, not by trusting review.
describe('the Better Auth dependency boundary', () => {
  it('is imported by no file outside apps/api/src/modules/auth', () => {
    const importsBetterAuth = filesMatching(
      srcDir,
      /(?:from|import|require\()\s*['"]better-auth(?:\/[^'"]*)?['"]/,
    );
    const outside = importsBetterAuth.filter(
      (file) => !file.includes(authModuleDir),
    );
    expect(outside).toEqual([]);
  });

  it('is imported by at least one file inside the auth module (the boundary is real)', () => {
    const inside = filesMatching(
      join(srcDir, 'modules', 'auth'),
      /from\s*['"]better-auth(?:\/[^'"]*)?['"]/,
    );
    expect(inside.length).toBeGreaterThan(0);
  });
});
