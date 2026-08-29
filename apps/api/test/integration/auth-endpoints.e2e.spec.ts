import { jest } from '@jest/globals';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import postgres from 'postgres';

import {
  sessionResponseSchema,
  signInResponseSchema,
  signUpResponseSchema,
} from '@gomide/contracts';

import { createApiApp } from '../../src/bootstrap.js';
import { makeTestEnv } from '../support/env.js';

jest.setTimeout(30_000);

// architecture-api.md rule 78: the entrypoint is tested through app.inject on a
// booted Fastify app — the routing, the body parse and the error translation
// only run on a real request. globalSetup migrated the container's default
// schema, which is what the app connects to.
describe('the four auth endpoints (task 03/02)', () => {
  let app: NestFastifyApplication;
  let sql: postgres.Sql;

  const uniqueEmail = (): string =>
    `player_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'a-correct-horse-battery-staple';

  const sessionCookie = (headers: Record<string, unknown>): string => {
    const raw = headers['set-cookie'];
    const list = Array.isArray(raw) ? raw : [raw as string];
    return list.map((cookie) => cookie.split(';')[0]).join('; ');
  };

  beforeAll(async () => {
    app = await createApiApp(makeTestEnv());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    sql = postgres(process.env.DATABASE_URL as string, { max: 2 });
  });

  afterAll(async () => {
    await sql.end();
    await app.close();
  });

  const countUsers = async (email: string): Promise<number> => {
    const rows = await sql<{ n: number }[]>`
      select count(*)::int as n from "user" where email = ${email}
    `;
    return rows[0]?.n ?? 0;
  };

  it('POST auth/sign-up creates the account, signs the player in and sets the session cookie', async () => {
    const email = uniqueEmail();
    const res = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password },
    });

    expect(res.statusCode).toBe(201);
    const body = signUpResponseSchema.parse(res.json());
    expect(body.user.email).toBe(email);
    expect(sessionCookie(res.headers)).toMatch(/better-auth\.session_token=/);
    expect(await countUsers(email)).toBe(1);
  });

  it('POST auth/sign-up with an e-mail that already has an account returns EMAIL_TAKEN and leaves one row', async () => {
    const email = uniqueEmail();
    await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ code: 'EMAIL_TAKEN' });
    expect(await countUsers(email)).toBe(1);
  });

  it('POST auth/sign-up with a password outside 8-128 characters is refused with VALIDATION_FAILED and creates no row', async () => {
    const email = uniqueEmail();
    const res = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password: 'short' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(await countUsers(email)).toBe(0);
  });

  it('POST auth/sign-in with correct credentials sets the cookie; a wrong password returns INVALID_CREDENTIALS and sets none', async () => {
    const email = uniqueEmail();
    await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password },
    });

    const ok = await app.inject({
      method: 'POST',
      url: '/auth/sign-in',
      payload: { email, password },
    });
    expect(ok.statusCode).toBe(200);
    signInResponseSchema.parse(ok.json());
    expect(sessionCookie(ok.headers)).toMatch(/better-auth\.session_token=/);

    const bad = await app.inject({
      method: 'POST',
      url: '/auth/sign-in',
      payload: { email, password: 'not-the-password' },
    });
    expect(bad.statusCode).toBe(401);
    expect(bad.json()).toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(bad.headers['set-cookie']).toBeUndefined();
  });

  it('POST auth/sign-out clears the cookie and drops that session, while a second session for the same user still resolves', async () => {
    const email = uniqueEmail();
    // autoSignIn means sign-up already opens session A.
    const signUp = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password },
    });
    const second = await app.inject({
      method: 'POST',
      url: '/auth/sign-in',
      payload: { email, password },
    });
    const cookieA = sessionCookie(signUp.headers);
    const cookieB = sessionCookie(second.headers);

    const rowsBefore = await sql<{ n: number }[]>`
      select count(*)::int as n from "session" s
      join "user" u on u.id = s.user_id where u.email = ${email}
    `;
    expect(rowsBefore[0]?.n).toBe(2);

    const out = await app.inject({
      method: 'POST',
      url: '/auth/sign-out',
      headers: { cookie: cookieA },
    });
    expect(out.statusCode).toBe(200);
    expect(out.json()).toEqual({ success: true });

    const rowsAfter = await sql<{ n: number }[]>`
      select count(*)::int as n from "session" s
      join "user" u on u.id = s.user_id where u.email = ${email}
    `;
    expect(rowsAfter[0]?.n).toBe(1);

    const stillIn = await app.inject({
      method: 'GET',
      url: '/auth/session',
      headers: { cookie: cookieB },
    });
    expect(sessionResponseSchema.parse(stillIn.json()).user?.email).toBe(email);

    const signedOut = await app.inject({
      method: 'GET',
      url: '/auth/session',
      headers: { cookie: cookieA },
    });
    expect(sessionResponseSchema.parse(signedOut.json()).user).toBeNull();
  });

  it('GET auth/session returns the signed-in user id and e-mail read from the cookie', async () => {
    const email = uniqueEmail();
    const signUp = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password },
    });
    const cookie = sessionCookie(signUp.headers);

    const res = await app.inject({
      method: 'GET',
      url: '/auth/session',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = sessionResponseSchema.parse(res.json());
    expect(body.user?.email).toBe(email);
    expect(typeof body.user?.id).toBe('string');
  });
});
