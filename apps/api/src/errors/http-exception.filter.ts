import {
  Catch,
  HttpException,
  HttpStatus,
  Inject,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Logger } from 'pino';

import { ERROR_CODES } from '@gomide/contracts';

import { ROOT_LOGGER } from '../logging/tokens.js';
import { writeLog } from '../logging/write.js';

type ErrorBodyType = { statusCode: number; code: string; message: string };

// architecture-api.md rules 37, 45 / FR.13.1: one filter normalises every HTTP
// response to exactly { statusCode, code, message }. `code` is machine-readable,
// `message` is for developers. An unexpected error is a 500 whose body carries
// no stack trace and no driver detail. The socket twin (task 06) emits the same
// `code` minus the status.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(@Inject(ROOT_LOGGER) private readonly root: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<{
      status: (code: number) => { send: (body: unknown) => unknown };
    }>();
    const body = this.normalise(exception);

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      writeLog(
        this.root,
        'HttpExceptionFilter',
        'error',
        'Unhandled error on the HTTP path',
        undefined,
        exception,
      );
    }

    reply.status(body.statusCode).send(body);
  }

  private normalise(exception: unknown): ErrorBodyType {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const carried =
        typeof response === 'object' && response !== null
          ? (response as Record<string, unknown>)
          : {};
      const code =
        typeof carried.code === 'string' ? carried.code : ERROR_CODES.INTERNAL_ERROR;
      const message =
        'message' in carried
          ? this.stringifyMessage(carried.message)
          : exception.message;
      return { statusCode: status, code, message };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Internal server error',
    };
  }

  private stringifyMessage(message: unknown): string {
    if (Array.isArray(message)) return message.join(', ');
    return typeof message === 'string' ? message : JSON.stringify(message);
  }
}
