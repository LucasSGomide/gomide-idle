import { HttpStatus, type ArgumentsHost } from '@nestjs/common';

import { AllExceptionsFilter } from '../src/errors/all-exceptions.filter.js';
import { CodedException } from '../src/errors/coded-exception.js';
import { createRootLogger } from '../src/logging/pino.js';

const filter = new AllExceptionsFilter(
  createRootLogger({ LOG_LEVEL: 'silent' }),
);

function httpHost(capture: {
  status?: number;
  body?: Record<string, unknown>;
}): ArgumentsHost {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getResponse: () => ({
        status: (code: number) => ({
          send: (body: Record<string, unknown>) => {
            capture.status = code;
            capture.body = body;
          },
        }),
      }),
    }),
  } as unknown as ArgumentsHost;
}

function wsHost(
  data: unknown,
  capture: {
    event?: string;
    frame?: Record<string, unknown>;
    disconnected?: boolean;
  },
): ArgumentsHost {
  return {
    getType: () => 'ws',
    switchToWs: () => ({
      getClient: () => ({
        emit: (event: string, frame: Record<string, unknown>) => {
          capture.event = event;
          capture.frame = frame;
        },
        disconnect: () => {
          capture.disconnected = true;
        },
      }),
      getData: () => data,
    }),
  } as unknown as ArgumentsHost;
}

describe('the socket error twin (architecture-api.md rule 45)', () => {
  it('emits the same code as the HTTP path for the same error', () => {
    const exception = new CodedException(
      'EMAIL_TAKEN',
      'taken',
      HttpStatus.CONFLICT,
    );

    const http: { body?: Record<string, unknown> } = {};
    filter.catch(exception, httpHost(http));

    const ws: { frame?: Record<string, unknown> } = {};
    filter.catch(exception, wsHost({ correlationId: 'c9' }, ws));

    expect(http.body?.code).toBe('EMAIL_TAKEN');
    expect(ws.frame?.code).toBe('EMAIL_TAKEN');
    expect(ws.frame?.code).toBe(http.body?.code);
  });

  it('shapes the socket frame as { correlationId, code, message } (+ children) and keeps the connection open', () => {
    const exception = new CodedException(
      'HANDSHAKE_INVALID',
      'bad payload',
      HttpStatus.BAD_REQUEST,
      [{ path: ['protocolVersion'], message: 'expected int' }],
    );

    const ws: {
      event?: string;
      frame?: Record<string, unknown>;
      disconnected?: boolean;
    } = {};
    filter.catch(exception, wsHost({ correlationId: 'c1' }, ws));

    expect(ws.event).toBe('error');
    expect(Object.keys(ws.frame ?? {}).sort()).toEqual([
      'children',
      'code',
      'correlationId',
      'message',
    ]);
    expect(ws.frame?.correlationId).toBe('c1');
    expect(ws.disconnected).toBeUndefined();
  });

  it('an unexpected error on the socket is INTERNAL_ERROR with no driver detail', () => {
    const ws: { frame?: Record<string, unknown> } = {};
    filter.catch(
      new Error('pg: relation "server_meta" does not exist'),
      wsHost({ correlationId: 'c2' }, ws),
    );
    expect(ws.frame?.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(ws.frame)).not.toMatch(
      /pg:|does not exist|server_meta|\bstack\b/i,
    );
  });
});
