import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import type { Logger } from 'pino';

import { ROOT_LOGGER } from './tokens.js';
import { writeLog } from './write.js';

type LogContextType = Record<string, unknown>;

// architecture-api.md rule 48 / FR.13.4: a logger is injected, never constructed
// in place. Transient scope plus INQUIRER tags every line with the injecting
// class's name as `module` (rule 50) without that class passing it in.
@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger {
  private readonly moduleName: string;

  constructor(
    @Inject(ROOT_LOGGER) private readonly root: Logger,
    @Inject(INQUIRER) parent: object | string,
  ) {
    this.moduleName =
      typeof parent === 'string'
        ? parent
        : (parent?.constructor?.name ?? 'app');
  }

  debug(message: string, context?: LogContextType): void {
    writeLog(this.root, this.moduleName, 'debug', message, context);
  }

  info(message: string, context?: LogContextType): void {
    writeLog(this.root, this.moduleName, 'info', message, context);
  }

  warn(message: string, context?: LogContextType): void {
    writeLog(this.root, this.moduleName, 'warn', message, context);
  }

  // architecture-api.md rule 55: error always carries the error object.
  error(message: string, error: unknown, context?: LogContextType): void {
    writeLog(this.root, this.moduleName, 'error', message, context, error);
  }
}
