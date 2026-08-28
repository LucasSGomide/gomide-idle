import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { POSTGRES_IMAGE } from './support/postgres.js';
import {
  setupWorkerSchema,
  teardownWorkerSchema,
  workerSchemaName,
  type WorkerDbType,
} from './support/db.js';
import { serverMeta } from '../../src/modules/system/infrastructure/database/schema/server-meta.schema.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

describe('the Jest database harness (architecture-api.md rule 91)', () => {
  it('runs one container for the whole project, not one per worker', () => {
    const ids = execFileSync(
      'docker',
      [
        'ps',
        '--filter',
        'label=org.testcontainers=true',
        '--filter',
        `ancestor=${POSTGRES_IMAGE}`,
        '--format',
        '{{.ID}}',
      ],
      { encoding: 'utf8' },
    )
      .trim()
      .split('\n')
      .filter(Boolean);
    expect(ids).toHaveLength(1);
  });

  it('the compose file and the test container run the same Postgres engine version', async () => {
    const compose = readFileSync(join(repoRoot, 'docker-compose.yml'), 'utf8');
    const composeImage = compose.match(/image:\s*(postgres:[^\s#]+)/)?.[1];
    expect(composeImage).toBe(POSTGRES_IMAGE);

    const worker = await setupWorkerSchema('engineprobe');
    try {
      const versionRows = await worker.sql<{ v: string }[]>`
        select current_setting('server_version') as v
      `;
      const serverVersion = versionRows[0]?.v ?? '';
      const expectedMajor = POSTGRES_IMAGE.match(/postgres:(\d+)/)?.[1];
      expect(serverVersion.startsWith(`${expectedMajor}.`)).toBe(true);
    } finally {
      await teardownWorkerSchema(worker);
    }
  });

  it('keys a schema off JEST_WORKER_ID and isolates one worker from another', async () => {
    expect(workerSchemaName('7')).toBe('test_w7');

    let a: WorkerDbType | undefined;
    let b: WorkerDbType | undefined;
    try {
      a = await setupWorkerSchema('isoA');
      b = await setupWorkerSchema('isoB');

      await a.db.update(serverMeta).set({ contentPackVersion: 'from-A' });
      await b.db.update(serverMeta).set({ contentPackVersion: 'from-B' });

      const [rowA] = await a.db.select().from(serverMeta);
      const [rowB] = await b.db.select().from(serverMeta);
      expect(rowA?.contentPackVersion).toBe('from-A');
      expect(rowB?.contentPackVersion).toBe('from-B');
    } finally {
      if (a) await teardownWorkerSchema(a);
      if (b) await teardownWorkerSchema(b);
    }
  });
});
