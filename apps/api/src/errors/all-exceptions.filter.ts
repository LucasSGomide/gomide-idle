import {
  Catch,
  HttpStatus,
  Inject,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Logger } from 'pino';
import type { Socket } from 'socket.io';

import { extractCorrelationId } from '../logging/socket-logging.js';
import { ROOT_LOGGER } from '../logging/tokens.js';
import { writeLog } from '../logging/write.js';
import { normaliseError } from './normalise.js';

type HttpReplyType = {
  status: (code: number) => { send: (body: unknown) => unknown };
};

// architecture-api.md rules 37, 45 / FR.13.1-13.2. One filter for both
// transports so the shape is declared in one place:
//   HTTP  -> exactly { statusCode, code, message }
//   socket -> { correlationId, code, message, children? }, connection kept open
// Both derive `code` from the same normaliseError call, so the same error is the
// same `code` however it arrived.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Inject(ROOT_LOGGER) private readonly root: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const normalised = normaliseError(exception);

    if (normalised.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      writeLog(
        this.root,
        'AllExceptionsFilter',
        'error',
        `Unhandled error on the ${host.getType()} path`,
        undefined,
        exception,
      );
    }

    if (host.getType() === 'ws') {
      this.replyOnSocket(host, normalised);
      return;
    }

    const reply = host.switchToHttp().getResponse<HttpReplyType>();
    reply.status(normalised.statusCode).send({
      statusCode: normalised.statusCode,
      code: normalised.code,
      message: normalised.message,
    });
  }

  private replyOnSocket(
    host: ArgumentsHost,
    normalised: ReturnType<typeof normaliseError>,
  ): void {
    const ws = host.switchToWs();
    const client = ws.getClient<Socket>();
    const correlationId = extractCorrelationId(ws.getData<unknown>());

    // architecture-api.md rule 43: never close the connection on a bad message.
    client.emit('error', {
      correlationId,
      code: normalised.code,
      message: normalised.message,
      ...(normalised.children ? { children: normalised.children } : {}),
    });
  }
}
