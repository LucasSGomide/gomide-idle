import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';

import { requestStore } from './als.js';

const CORRELATION_HEADER = 'x-correlation-id';

// stack-api.md rule 45 / architecture-api.md rule 52: pino-http registered in
// Fastify's onRequest hook directly, so the request log context is initialised
// once before any handler runs. autoLogging is off — feature code logs through
// AppLogger. pino-http owns request-id generation; the id becomes the
// correlation id every log line and the response carry.
export function installRequestLogging(
  fastify: FastifyInstance,
  root: Logger,
): void {
  const middleware = pinoHttp({
    logger: root,
    autoLogging: false,
    genReqId: (req) => {
      const header = req.headers[CORRELATION_HEADER];
      const fromHeader = Array.isArray(header) ? header[0] : header;
      return fromHeader && fromHeader.length > 0 ? fromHeader : randomUUID();
    },
  });

  fastify.addHook('onRequest', (request, reply, done) => {
    middleware(request.raw, reply.raw);
    const correlationId = String(request.raw.id);
    void reply.header(CORRELATION_HEADER, correlationId);
    requestStore.enterWith({ correlationId });
    done();
  });
}
