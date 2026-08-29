import { drizzle } from 'drizzle-orm/postgres-js';

import { createAuthInstance } from '../../src/modules/auth/infrastructure/auth.instance.js';
import {
  setupWorkerSchema,
  teardownWorkerSchema,
  type WorkerDbType,
} from './support/db.js';

// task 01 AC1, AC6 / FR.1.1, auth.md rule 5. The worker schema is produced by
// running the project's own migrations (architecture-api.md rule 81), so this
// asserts the committed migration, not a table any test built.
describe('the auth tables migration', () => {
  let worker: WorkerDbType;

  beforeAll(async () => {
    worker = await setupWorkerSchema('authmig');
  });

  afterAll(async () => {
    await teardownWorkerSchema(worker);
  });

  it('creates user, session, account and verification', async () => {
    const rows = await worker.sql<{ name: string }[]>`
      select table_name as name
      from information_schema.tables
      where table_schema = ${worker.schema}
      order by table_name
    `;
    const names = rows.map((row) => row.name);
    for (const table of ['user', 'session', 'account', 'verification']) {
      expect(names).toContain(table);
    }
  });

  it('stores a password written through the instance hashed, with the plain text in no column', async () => {
    const auth = createAuthInstance(drizzle({ client: worker.sql }));
    const email = 'ada@example.com';
    const password = 'correct horse battery staple';

    await auth.api.signUpEmail({
      body: { email, password, name: 'ada' },
    });

    const accounts = await worker.sql<Record<string, unknown>[]>`
      select * from account
    `;
    expect(accounts).toHaveLength(1);
    const stored = accounts[0]?.password;
    expect(typeof stored).toBe('string');
    expect(stored).not.toBe(password);
    // Better Auth's scrypt hash is a long hex-ish string, never the plain text.
    expect((stored as string).length).toBeGreaterThan(40);

    const users = await worker.sql<Record<string, unknown>[]>`
      select * from "user"
    `;
    expect(users).toHaveLength(1);
    expect(JSON.stringify([...accounts, ...users])).not.toContain(password);
  });
});
