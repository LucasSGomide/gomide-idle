import pino, { type Logger, type LoggerOptions } from 'pino';

import type { EnvType } from '../config/env.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'token',
  'accesstoken',
  'refreshtoken',
  'sessionid',
  'session',
  'sid',
  'email',
  'authorization',
  'cookie',
  'setcookie',
  'secret',
  'appsecret',
  'apikey',
  'appkey',
]);

const normalise = (key: string): string =>
  key.toLowerCase().replace(/[-_]/g, '');

// architecture-api.md rule 51: no password, token, session id or e-mail address
// ever reaches a log line. Recursive, so it holds however deeply a caller nests
// its context rather than depending on a fixed list of paths. Ships with the log
// shape rather than being remembered per feature.
export function scrub(value: unknown, seen = new WeakSet<object>()): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => scrub(item, seen));
  }
  if (value !== null && typeof value === 'object') {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = SENSITIVE_KEYS.has(normalise(key))
        ? '[REDACTED]'
        : scrub(item, seen);
    }
    return out;
  }
  return value;
}

// architecture-api.md rule 50: timestamp, level, module, message and the
// correlation id at the top level; everything else under context. pid and
// hostname are dropped (base: null) rather than left at the top.
export function createRootLogger(
  env: Pick<EnvType, 'LOG_LEVEL'>,
  destination?: NodeJS.WritableStream,
): Logger {
  const options: LoggerOptions = {
    level: env.LOG_LEVEL,
    base: null,
    messageKey: 'message',
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    formatters: {
      level: (label) => ({ level: label }),
      log: (object) => scrub(object) as Record<string, unknown>,
    },
  };
  return destination ? pino(options, destination) : pino(options);
}
