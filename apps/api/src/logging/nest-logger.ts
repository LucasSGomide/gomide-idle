import type { LoggerService } from '@nestjs/common';
import type { Logger } from 'pino';

import { writeLog, type LogLevelType } from './write.js';

// NestJS's own boot output — module initialisation, the route map, the gateway
// subscriptions, "Nest application successfully started" — reaches the process
// through a LoggerService. `NestFactory.create` was passed `logger: false`,
// which threw all of it away and left a healthy boot and a stalled one looking
// identical from the terminal.
//
// Nest's default ConsoleLogger would print that output in a second format,
// which architecture-api.md rule 50 forbids: one fixed top level is what makes
// a single query work across every package. So the lines are routed through the
// same pino instance every other line goes through. Nest passes its context as
// the last argument ('RouterExplorer', 'NestApplication'); that becomes
// `module`, exactly as AppLogger's INQUIRER-derived name does for feature code.
export class NestPinoLogger implements LoggerService {
  constructor(private readonly root: Logger) {}

  log(message: unknown, ...rest: unknown[]): void {
    this.write('info', message, rest);
  }

  warn(message: unknown, ...rest: unknown[]): void {
    this.write('warn', message, rest);
  }

  debug(message: unknown, ...rest: unknown[]): void {
    this.write('debug', message, rest);
  }

  // Nest has no `trace`; verbose is its most detailed level, and rule 55 gives
  // development detail to `debug`.
  verbose(message: unknown, ...rest: unknown[]): void {
    this.write('debug', message, rest);
  }

  fatal(message: unknown, ...rest: unknown[]): void {
    this.error(message, ...rest);
  }

  // Nest calls this as error(message, stack, context). Rule 55 requires the
  // error object on every error line, so the stack travels as one.
  error(message: unknown, ...rest: unknown[]): void {
    const moduleName = contextOf(rest);
    const stack =
      rest.length > 1 && typeof rest[0] === 'string' ? rest[0] : undefined;
    writeLog(
      this.root,
      moduleName,
      'error',
      String(message),
      undefined,
      stack ?? message,
    );
  }

  private write(level: LogLevelType, message: unknown, rest: unknown[]): void {
    writeLog(this.root, contextOf(rest), level, String(message));
  }
}

// Nest appends its context string last; anything else in the tail is a value it
// was asked to print, not a module name.
function contextOf(rest: unknown[]): string {
  const last = rest.at(-1);
  return typeof last === 'string' ? last : 'nest';
}
