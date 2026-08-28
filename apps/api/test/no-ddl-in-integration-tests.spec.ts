import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findAdHocDdl } from './support/no-ddl-in-tests.js';

const here = dirname(fileURLToPath(import.meta.url));

describe('integration tests apply migrations, they do not create tables (FR.15.2)', () => {
  it('no ad-hoc CREATE TABLE / DROP TABLE under test/integration', () => {
    expect(
      findAdHocDdl(join(here, 'integration'), (path) =>
        path.includes(`${sep}support${sep}`),
      ),
    ).toEqual([]);
  });

  it('flags a spec that creates a table itself', () => {
    expect(findAdHocDdl(join(here, 'fixtures', 'integration')).length).toBeGreaterThan(0);
  });
});
