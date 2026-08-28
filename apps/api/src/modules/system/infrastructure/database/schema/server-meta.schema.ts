import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text } from 'drizzle-orm/pg-core';

// naming.md rule 11: the table takes its singular snake_case name and is exported
// as the plural camelCase symbol. stack-api.md rule 16: real columns throughout,
// no JSONB. FR.10.2: one seeded row carrying the socket protocol integer, the
// content-pack version and the build id.
export const serverMeta = pgTable(
  'server_meta',
  {
    id: integer('id').primaryKey().default(1),
    socketProtocolVersion: integer('socket_protocol_version').notNull(),
    contentPackVersion: text('content_pack_version').notNull(),
    // Seeded with a placeholder by the first migration. A build id fixed at
    // migration time is stale on the next build and one shared row cannot say
    // which instance answered, so the running API reports env.BUILD_ID and this
    // column is the fallback only. See resolve-build-id.ts.
    buildId: text('build_id').notNull(),
  },
  (table) => [check('server_meta_singleton', sql`${table.id} = 1`)],
);
