import { Controller, Get, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { CodedException } from '../src/errors/coded-exception.js';
import { ErrorsModule } from '../src/errors/errors.module.js';
import { LoggingModule } from '../src/logging/logging.module.js';
import { createRootLogger } from '../src/logging/pino.js';

@Controller()
class ThrowingController {
  @Get('/throw/coded')
  coded(): never {
    throw new CodedException(
      'EMAIL_TAKEN',
      'That address already has an account',
      HttpStatus.CONFLICT,
    );
  }

  @Get('/throw/raw')
  raw(): never {
    throw new Error('pg: relation "server_meta" does not exist');
  }
}

describe('the HTTP error shape (FR.13.1)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggingModule.register(createRootLogger({ LOG_LEVEL: 'silent' })),
        ErrorsModule,
      ],
      controllers: [ThrowingController],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
      { logger: false },
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('normalises a thrown expected error to exactly { statusCode, code, message }', async () => {
    const res = await app.inject({ method: 'GET', url: '/throw/coded' });

    expect(res.statusCode).toBe(HttpStatus.CONFLICT);
    expect(res.json()).toEqual({
      statusCode: HttpStatus.CONFLICT,
      code: 'EMAIL_TAKEN',
      message: 'That address already has an account',
    });
    expect(Object.keys(res.json() as object).sort()).toEqual([
      'code',
      'message',
      'statusCode',
    ]);
  });

  it('normalises an unexpected error to the same three keys, with no stack and no driver detail', async () => {
    const res = await app.inject({ method: 'GET', url: '/throw/raw' });
    const body = res.json() as Record<string, unknown>;

    expect(res.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(Object.keys(body).sort()).toEqual(['code', 'message', 'statusCode']);
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(body)).not.toMatch(/stack|pg:|server_meta|relation/i);
  });
});
