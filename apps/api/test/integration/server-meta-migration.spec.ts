import { serverMeta } from '../../src/modules/system/infrastructure/database/schema/server-meta.schema.js';
import {
  setupWorkerSchema,
  teardownWorkerSchema,
  type WorkerDbType,
} from './support/db.js';

describe('the server_meta migration (FR.10.2, FR.15.2)', () => {
  let worker: WorkerDbType;

  beforeAll(async () => {
    worker = await setupWorkerSchema();
  });

  afterAll(async () => {
    await teardownWorkerSchema(worker);
  });

  it('creates server_meta and seeds exactly one row', async () => {
    const rows = await worker.db.select().from(serverMeta);
    expect(rows).toHaveLength(1);
  });

  it('the seeded row carries the protocol integer, the content-pack version and the build id', async () => {
    const rows = await worker.db.select().from(serverMeta);
    expect(rows[0]).toEqual({
      id: 1,
      socketProtocolVersion: 1,
      contentPackVersion: '0.1.0',
      buildId: 'unknown',
    });
  });

  it('produced the schema by running migrations, not by any test creating a table', async () => {
    const tables = await worker.sql<{ name: string }[]>`
      select table_name as name
      from information_schema.tables
      where table_schema = ${worker.schema}
      order by table_name
    `;
    const names = tables.map((row) => row.name);
    expect(names).toContain('server_meta');
    // drizzle's own bookkeeping table, written by the migrator into this schema
    expect(names).toContain('__drizzle_migrations');
  });
});
