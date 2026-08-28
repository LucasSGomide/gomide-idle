import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { AppLogger } from '../src/logging/app-logger.js';
import { LoggingModule } from '../src/logging/logging.module.js';
import { createRootLogger } from '../src/logging/pino.js';
import { installRequestLogging } from '../src/logging/request-logging.js';
import { LineSink } from './support/line-sink.js';

@Controller()
class LoggingController {
  constructor(private readonly logger: AppLogger) {}

  @Get('/log')
  async log(): Promise<{ ok: true }> {
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 20));
    this.logger.info('handled the request', { step: 'done' });
    return { ok: true };
  }

  @Post('/log-body')
  logBody(@Body() body: Record<string, unknown>): { ok: true } {
    this.logger.info('received credentials-shaped body', body);
    return { ok: true };
  }
}

describe('the log line shape (architecture-api.md rules 50-51)', () => {
  let app: NestFastifyApplication;
  let sink: LineSink;

  beforeAll(async () => {
    sink = new LineSink();
    const root = createRootLogger({ LOG_LEVEL: 'info' }, sink);
    const moduleRef = await Test.createTestingModule({
      imports: [LoggingModule.register(root)],
      controllers: [LoggingController],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ trustProxy: true }),
      { logger: false },
    );
    installRequestLogging(app.getHttpAdapter().getInstance(), root);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps timestamp, level, module, message and the correlation id at the top level, everything else under context', async () => {
    sink.lines.length = 0;
    await app.inject({ method: 'GET', url: '/log' });

    const line = sink.lines.find(
      (entry) => entry.message === 'handled the request',
    );
    expect(line).toBeDefined();
    expect(Object.keys(line ?? {}).sort()).toEqual(
      [
        'context',
        'correlationId',
        'level',
        'message',
        'module',
        'timestamp',
      ].sort(),
    );
    expect(line?.module).toBe('LoggingController');
    expect(line?.level).toBe('info');
    expect(line?.context).toEqual({ step: 'done' });
    expect(typeof line?.correlationId).toBe('string');
    expect(typeof line?.timestamp).toBe('string');
  });

  it('gives two concurrent requests two different correlation ids, each handler its own', async () => {
    sink.lines.length = 0;
    const [a, b] = await Promise.all([
      app.inject({ method: 'GET', url: '/log' }),
      app.inject({ method: 'GET', url: '/log' }),
    ]);

    const idA = a.headers['x-correlation-id'];
    const idB = b.headers['x-correlation-id'];
    expect(idA).toBeDefined();
    expect(idB).toBeDefined();
    expect(idA).not.toBe(idB);

    const handled = sink.lines.filter(
      (l) => l.message === 'handled the request',
    );
    expect(handled).toHaveLength(2);
    expect(new Set(handled.map((l) => l.correlationId))).toEqual(
      new Set([idA, idB]),
    );
  });

  it('logs none of a password, token, session id or e-mail address', async () => {
    sink.lines.length = 0;
    await app.inject({
      method: 'POST',
      url: '/log-body',
      payload: {
        password: 'hunter2-secret',
        token: 'tok_abc123',
        sessionId: 'sess_zzz999',
        email: 'player@example.com',
      },
    });

    const dump = JSON.stringify(sink.lines);
    expect(dump).not.toContain('hunter2-secret');
    expect(dump).not.toContain('tok_abc123');
    expect(dump).not.toContain('sess_zzz999');
    expect(dump).not.toContain('player@example.com');

    const line = sink.lines.find(
      (l) => l.message === 'received credentials-shaped body',
    );
    expect(line?.context).toEqual({
      password: '[REDACTED]',
      token: '[REDACTED]',
      sessionId: '[REDACTED]',
      email: '[REDACTED]',
    });
  });
});
