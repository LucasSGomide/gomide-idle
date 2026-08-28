import { Inject, Injectable } from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type {
  GetServerMetaDaoPort,
  ServerMetaRowType,
} from '../../../application/get-server-meta.dao.port.js';
import { serverMeta } from '../schema/server-meta.schema.js';
import { DATABASE } from '../tokens.js';

// naming.md rule 10: <Verb><Resource>Dao in <verb>-<resource>.dao.ts; the ORM
// appears in neither the class name nor the file name. architecture-api.md
// rule 22: the Drizzle inferred row type never leaves this layer — the explicit
// column projection returns exactly the port's ServerMetaRowType.
@Injectable()
export class GetServerMetaDao implements GetServerMetaDaoPort {
  constructor(@Inject(DATABASE) private readonly db: PostgresJsDatabase) {}

  async getServerMeta(): Promise<ServerMetaRowType> {
    const rows = await this.db
      .select({
        socketProtocolVersion: serverMeta.socketProtocolVersion,
        contentPackVersion: serverMeta.contentPackVersion,
        buildId: serverMeta.buildId,
      })
      .from(serverMeta);

    const row = rows[0];
    if (!row) {
      throw new Error(
        'server_meta has no row — the seed migration did not run',
      );
    }
    return row;
  }
}
