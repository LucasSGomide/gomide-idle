import { GetServerMetaDao } from '../../src/modules/system/infrastructure/database/dao/get-server-meta.dao.js';
import {
  setupWorkerSchema,
  teardownWorkerSchema,
  type WorkerDbType,
} from './support/db.js';

describe('GetServerMetaDao against real Postgres (architecture-api.md rule 22)', () => {
  let worker: WorkerDbType;

  beforeAll(async () => {
    worker = await setupWorkerSchema();
  });
  afterAll(async () => {
    await teardownWorkerSchema(worker);
  });

  it('returns its own flat shape and nothing Drizzle-inferred', async () => {
    const dao = new GetServerMetaDao(worker.db);
    const row = await dao.getServerMeta();

    expect(Object.keys(row).sort()).toEqual([
      'buildId',
      'contentPackVersion',
      'socketProtocolVersion',
    ]);
    expect(row).toEqual({
      socketProtocolVersion: 1,
      contentPackVersion: '0.1.0',
      buildId: 'unknown',
    });
  });
});
