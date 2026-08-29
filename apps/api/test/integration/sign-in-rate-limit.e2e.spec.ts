/* eslint-disable no-await-in-loop -- rate-limit counting must be sequential */
import { jest } from '@jest/globals';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';

import { createApiApp } from '../../src/bootstrap.js';
import {
  SIGN_IN_EMAIL_LIMIT,
  SIGN_IN_IP_LIMIT,
} from '../../src/modules/auth/entrypoint/sign-in-throttle.js';
import { makeTestEnv } from '../support/env.js';

jest.setTimeout(30_000);

const password = 'a-correct-horse-battery-staple';
const uniqueEmail = (tag: string): string =>
  `rl_${tag}_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

// stack-api.md rule 39 / auth.md rule 17 / FR.5.1: one guard on POST
// auth/sign-in, two keys.
describe('sign-in rate limiting (task 04/04)', () => {
  let app: NestFastifyApplication;

  const signIn = (email: string, forwardedFor: string, pw = 'wrong-pw') =>
    app.inject({
      method: 'POST',
      url: '/auth/sign-in',
      headers: { 'x-forwarded-for': forwardedFor },
      payload: { email, password: pw },
    });

  beforeAll(async () => {
    app = await createApiApp(makeTestEnv());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  afterAll(async () => {
    await app.close();
  });

  it('attempts from one address past the limit return TOO_MANY_ATTEMPTS; an attempt under the limit still succeeds', async () => {
    const address = '198.51.100.10';
    for (let i = 0; i < SIGN_IN_IP_LIMIT; i += 1) {
      // a fresh e-mail each time so only the address key accumulates
      const res = await signIn(uniqueEmail(`ip${i}`), address);
      expect(res.statusCode).toBe(401);
    }
    const blocked = await signIn(uniqueEmail('ip-over'), address);
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json()).toMatchObject({ code: 'TOO_MANY_ATTEMPTS' });

    // a different address, a real account: under the limit, it still works
    const email = uniqueEmail('ok');
    await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      headers: { 'x-forwarded-for': '198.51.100.11' },
      payload: { email, password },
    });
    const ok = await signIn(email, '198.51.100.12', password);
    expect(ok.statusCode).toBe(200);
  });

  it('attempts against one e-mail past the limit return TOO_MANY_ATTEMPTS even from a different address each time', async () => {
    const email = uniqueEmail('victim');
    for (let i = 0; i < SIGN_IN_EMAIL_LIMIT; i += 1) {
      const res = await signIn(email, `198.51.101.${i + 1}`);
      expect(res.statusCode).toBe(401);
    }
    const blocked = await signIn(email, '198.51.101.99');
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json()).toMatchObject({ code: 'TOO_MANY_ATTEMPTS' });
  });

  it('a throttled sign-in returns the project error body with a code and no @nestjs/throttler default message', async () => {
    const address = '198.51.102.10';
    for (let i = 0; i <= SIGN_IN_IP_LIMIT; i += 1) {
      await signIn(uniqueEmail(`shape${i}`), address);
    }
    const res = await signIn(uniqueEmail('shape-final'), address);
    expect(res.statusCode).toBe(429);
    const body = res.json() as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['code', 'message', 'statusCode']);
    expect(body.code).toBe('TOO_MANY_ATTEMPTS');
    expect(JSON.stringify(body)).not.toMatch(
      /ThrottlerException|Too Many Requests/,
    );
  });

  it('POST auth/sign-up and GET auth/session are refused by neither key', async () => {
    const address = '198.51.103.10';
    // trip the address key
    for (let i = 0; i <= SIGN_IN_IP_LIMIT; i += 1) {
      await signIn(uniqueEmail(`bystander${i}`), address);
    }
    expect((await signIn(uniqueEmail('confirm'), address)).statusCode).toBe(
      429,
    );

    const signUp = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      headers: { 'x-forwarded-for': address },
      payload: { email: uniqueEmail('after'), password },
    });
    expect(signUp.statusCode).toBe(201);

    const session = await app.inject({
      method: 'GET',
      url: '/auth/session',
      headers: { 'x-forwarded-for': address },
    });
    expect(session.statusCode).toBe(200);
  });
});
