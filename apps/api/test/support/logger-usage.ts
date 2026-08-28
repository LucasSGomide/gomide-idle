import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FORBIDDEN: Array<{ pattern: string; re: RegExp }> = [
  {
    pattern: 'new Logger()',
    re: /\bnew\s+(?:Logger|ConsoleLogger|AppLogger|PinoLogger)\s*\(/,
  },
  {
    pattern: 'console call',
    re: /\bconsole\s*\.\s*(?:log|info|warn|error|debug|trace)\s*\(/,
  },
  { pattern: 'pino() call', re: /(?:^|[^.\w])pino\s*\(/ },
];

export type LoggerUsageViolationType = {
  file: string;
  line: number;
  pattern: string;
};

// architecture-api.md rule 48 / FR.13.4: a logger is injected, never constructed
// in place, and `console` is never called. The logging module itself builds the
// one pino instance, so it is the single allowed exception.
export function findConstructedLoggers(
  dir: string,
  allow: (fullPath: string) => boolean = () => false,
): LoggerUsageViolationType[] {
  const violations: LoggerUsageViolationType[] = [];

  const walk = (current: string): void => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!full.endsWith('.ts') || full.endsWith('.spec.ts')) continue;
      if (allow(full)) continue;

      const lines = readFileSync(full, 'utf8').split('\n');
      lines.forEach((text, index) => {
        for (const { pattern, re } of FORBIDDEN) {
          if (re.test(text)) {
            violations.push({ file: full, line: index + 1, pattern });
          }
        }
      });
    }
  };

  walk(dir);
  return violations;
}
