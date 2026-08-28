import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Returns every .ts file under dir whose text matches pattern.
export function filesMatching(dir: string, pattern: RegExp): string[] {
  const hits: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (full.endsWith('.ts') && pattern.test(readFileSync(full, 'utf8'))) {
        hits.push(full);
      }
    }
  };
  walk(dir);
  return hits;
}
