import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type NestFastifyApplication } from '@nestjs/platform-fastify';

import { createApiApp } from '../src/bootstrap.js';
import {
  addressTracker,
  emailTracker,
} from '../src/modules/auth/entrypoint/sign-in-throttle.js';
import { makeTestEnv } from './support/env.js';

// task 04 AC4 / auth.md rule 17: the two trackers, tested as the pure functions
// they are.
describe('the sign-in rate-limit trackers', () => {
  it('the e-mail tracker reads the submitted e-mail, normalised', () => {
    expect(
      emailTracker({ body: { email: 'Ada@Example.com' }, ip: '203.0.113.7' }),
    ).toBe('email:ada@example.com');
  });

  it('the e-mail tracker falls back to the source address when the body has no e-mail', () => {
    expect(emailTracker({ body: {}, ip: '203.0.113.7' })).toBe(
      'addr:203.0.113.7',
    );
    expect(emailTracker({ ip: '203.0.113.7' })).toBe('addr:203.0.113.7');
  });

  it('the address tracker returns the source address', () => {
    expect(addressTracker({ ip: '203.0.113.7' })).toBe('addr:203.0.113.7');
    expect(addressTracker({})).toBe('addr:unknown');
  });
});

// task 04 AC6 / auth.md gotcha 34: trustProxy on the Fastify adapter, or the
// per-address key the guard reads is the proxy for every request.
describe('the Fastify adapter', () => {
  let app: NestFastifyApplication;
  let seenIp: string | undefined;

  beforeAll(async () => {
    app = await createApiApp(makeTestEnv());
    app
      .getHttpAdapter()
      .getInstance()
      .addHook('onRequest', (request, _reply, done) => {
        seenIp = request.ip;
        done();
      });
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  it('resolves the client address from the forwarded header, so the guard keys on it', async () => {
    await app.inject({
      method: 'GET',
      url: '/server-meta',
      headers: { 'x-forwarded-for': '203.0.113.7' },
      remoteAddress: '10.9.9.9',
    });
    expect(seenIp).toBe('203.0.113.7');
  });

  it('is constructed with trustProxy enabled', () => {
    const bootstrap = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '..',
        'src',
        'bootstrap.ts',
      ),
      'utf8',
    );
    expect(bootstrap).toMatch(/new FastifyAdapter\(\{[^}]*trustProxy:\s*true/s);
  });
});
