import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { filesMatching } from './support/scan.js';

const systemDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'modules',
  'system',
);

const portFile = join(systemDir, 'application', 'get-server-meta.dao.port.ts');
const daoFile = join(
  systemDir,
  'infrastructure',
  'database',
  'dao',
  'get-server-meta.dao.ts',
);

describe('the read path file layout (naming.md rules 2, 7, 10)', () => {
  it('the port is a .port.ts file in application/, its interface suffixed Port', () => {
    expect(existsSync(portFile)).toBe(true);
    expect(readFileSync(portFile, 'utf8')).toMatch(
      /export interface GetServerMetaDaoPort\b/,
    );
  });

  it('the implementation is GetServerMetaDao in get-server-meta.dao.ts', () => {
    expect(existsSync(daoFile)).toBe(true);
    expect(readFileSync(daoFile, 'utf8')).toMatch(
      /export class GetServerMetaDao\b/,
    );
  });

  it('the ORM appears in neither the file name nor the symbol name', () => {
    for (const path of [portFile, daoFile]) {
      expect(path.toLowerCase()).not.toMatch(/drizzle|postgres|orm|\bpg\b/);
    }
    expect(readFileSync(daoFile, 'utf8')).not.toMatch(
      /class \w*(Drizzle|Orm|Pg)\w*Dao/,
    );
  });
});

describe('no Drizzle inferred row type escapes the data-access layer (architecture-api.md rule 22)', () => {
  it('nothing under infrastructure/database exports a $inferSelect / $inferInsert type', () => {
    const dbDir = join(systemDir, 'infrastructure', 'database');
    expect(
      filesMatching(dbDir, /export\b[^\n]*\$infer(Select|Insert)/),
    ).toEqual([]);
  });
});
