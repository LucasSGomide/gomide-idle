import { type NestFastifyApplication } from '@nestjs/platform-fastify';

import { createApiApp } from '../src/bootstrap.js';
import { makeTestEnv } from './support/env.js';

describe('API bootstrap', () => {
  let app: NestFastifyApplication;
  let lastSeenIp: string | undefined;

  beforeAll(async () => {
    app = await createApiApp(makeTestEnv());
    // A transport-level probe: onRequest runs before routing, so this needs no
    // route and adds nothing to the app itself.
    app
      .getHttpAdapter()
      .getInstance()
      .addHook('onRequest', (request, _reply, done) => {
        lastSeenIp = request.ip;
        done();
      });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('boots on Fastify', () => {
    expect(app.getHttpAdapter().getType()).toBe('fastify');
  });

  it('resolves the client address from the forwarded header, not the proxy connection', async () => {
    await app.inject({
      method: 'GET',
      url: '/does-not-need-to-exist',
      headers: { 'x-forwarded-for': '203.0.113.7' },
      remoteAddress: '10.9.9.9',
    });
    expect(lastSeenIp).toBe('203.0.113.7');
  });
});
