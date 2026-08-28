import { getTableName } from 'drizzle-orm';

import * as schemaModule from '../src/modules/system/infrastructure/database/schema/server-meta.schema.js';

// naming.md rule 11.
describe('the server_meta Drizzle table', () => {
  it('is exported as the plural camelCase symbol', () => {
    expect(schemaModule).toHaveProperty('serverMeta');
    const asRecord = schemaModule as unknown as Record<string, unknown>;
    expect(asRecord.server_meta).toBeUndefined();
    expect(asRecord.serverMetas).toBeUndefined();
  });

  it('is declared under the singular snake_case table name', () => {
    expect(getTableName(schemaModule.serverMeta)).toBe('server_meta');
  });
});
