import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FORBIDDEN = /\b(create|drop)\s+table\b/i;

export type AdHocDdlType = { file: string; line: number };

// FR.15.2: integration tests apply the project's own migrations rather than
// creating tables themselves, so the schema under test is the schema that ships.
export function findAdHocDdl(
  dir: string,
  allow: (fullPath: string) => boolean = () => false,
): AdHocDdlType[] {
  const hits: AdHocDdlType[] = [];

  const walk = (current: string): void => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!full.endsWith('.ts') || allow(full)) continue;
      readFileSync(full, 'utf8')
        .split('\n')
        .forEach((text, index) => {
          if (FORBIDDEN.test(text)) hits.push({ file: full, line: index + 1 });
        });
    }
  };

  walk(dir);
  return hits;
}
