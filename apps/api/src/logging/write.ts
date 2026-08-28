import type { Logger } from 'pino';

import { requestStore } from './als.js';

export type LogLevelType = 'debug' | 'info' | 'warn' | 'error';

// The one place a log line is shaped (architecture-api.md rules 50-51): the top
// level is always timestamp, level, module, message and the correlation id, with
// everything else under context.
export function writeLog(
  root: Logger,
  moduleName: string,
  level: LogLevelType,
  message: string,
  context?: Record<string, unknown>,
  error?: unknown,
): void {
  const store = requestStore.getStore();

  const payload: Record<string, unknown> = { module: moduleName };
  if (store) {
    payload.correlationId = store.correlationId;
  }

  const mergedContext: Record<string, unknown> = { ...context };
  if (error !== undefined) {
    mergedContext.error =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;
  }
  if (Object.keys(mergedContext).length > 0) {
    payload.context = mergedContext;
  }

  root[level](payload, message);
}
