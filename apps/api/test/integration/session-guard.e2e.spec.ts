import { jest } from '@jest/globals';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { sessionResponseSchema } from '@gomide/contracts';

import { createApiApp } from '../../src/bootstrap.js';
import { createAuthInstance } from '../../src/modules/auth/infrastructure/auth.instance.js';
import { makeTestEnv } from '../support/env.js';

jest.setTimeout(30_000);

const password = 'a-correct-horse-battery-staple';
const uniqueEmail = (): string =>
  `guard_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

const cookieOf = (headers: Record<string, unknown>): string => {
  const raw = headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : [raw as string];
  return list.map((cookie) => cookie.split(';')[0]).join('; ');
};

// auth.md rules 11-13, 18, 31 / FR.2.2, FR.5.2. POST auth/sign-out is the
// guarded route used to exercise the guard (it needs a session and is not
// @Public); GET auth/session is the public activity that also slides the expiry.
describe('the global session guard and the registration switch (task 03/03)', () => {
  let app: NestFastifyApplication;
  let sql: postgres.Sql;

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

  const signUp = async (email: string) =>
    app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password },
    });

  it('a guarded route with no cookie returns 401 carrying a code, and with a valid session cookie returns 200', async () => {
    const noCookie = await app.inject({
      method: 'POST',
      url: '/auth/sign-out',
    });
    expect(noCookie.statusCode).toBe(401);
    expect(noCookie.json()).toMatchObject({ code: 'NO_SESSION' });

    const cookie = cookieOf((await signUp(uniqueEmail())).headers);
    const withCookie = await app.inject({
      method: 'POST',
      url: '/auth/sign-out',
      headers: { cookie },
    });
    expect(withCookie.statusCode).toBe(200);
  });

  it('POST sign-up, POST sign-in, GET session and GET server-meta all answer with no session', async () => {
    const email = uniqueEmail();
    expect((await signUp(email)).statusCode).toBe(201);

    const signIn = await app.inject({
      method: 'POST',
      url: '/auth/sign-in',
      payload: { email, password },
    });
    expect(signIn.statusCode).toBe(200);

    const session = await app.inject({ method: 'GET', url: '/auth/session' });
    expect(session.statusCode).toBe(200);
    expect(session.json()).not.toMatchObject({ code: 'NO_SESSION' });

    const meta = await app.inject({ method: 'GET', url: '/server-meta' });
    expect(meta.statusCode).toBe(200);
  });

  it('a session row with an expiry in the past is refused by the guard; one inside its window is accepted', async () => {
    const emailPast = uniqueEmail();
    const cookiePast = cookieOf((await signUp(emailPast)).headers);
    await sql`
      update "session" set expires_at = now() - interval '1 hour'
      from "user" u where "session".user_id = u.id and u.email = ${emailPast}
    `;
    const refused = await app.inject({
      method: 'POST',
      url: '/auth/sign-out',
      headers: { cookie: cookiePast },
    });
    expect(refused.statusCode).toBe(401);
    expect(refused.json()).toMatchObject({ code: 'NO_SESSION' });

    const cookieOk = cookieOf((await signUp(uniqueEmail())).headers);
    const accepted = await app.inject({
      method: 'POST',
      url: '/auth/sign-out',
      headers: { cookie: cookieOk },
    });
    expect(accepted.statusCode).toBe(200);
  });

  it('activity inside the refresh window extends the stored expiry rather than leaving it fixed', async () => {
    const email = uniqueEmail();
    const cookie = cookieOf((await signUp(email)).headers);

    await sql`
      update "session" set updated_at = now() - interval '2 days',
        expires_at = now() + interval '20 days'
      from "user" u where "session".user_id = u.id and u.email = ${email}
    `;
    const [before] = await sql<{ expires_at: string }[]>`
      select s.expires_at from "session" s join "user" u on u.id = s.user_id
      where u.email = ${email}
    `;

    const activity = await app.inject({
      method: 'GET',
      url: '/auth/session',
      headers: { cookie },
    });
    expect(activity.statusCode).toBe(200);

    const [after] = await sql<{ expires_at: string }[]>`
      select s.expires_at from "session" s join "user" u on u.id = s.user_id
      where u.email = ${email}
    `;
    expect(new Date(after!.expires_at).getTime()).toBeGreaterThan(
      new Date(before!.expires_at).getTime(),
    );
  });

  it('GET auth/session carries the registration flag both signed in and signed out', async () => {
    const signedOut = await app.inject({ method: 'GET', url: '/auth/session' });
    const outBody = sessionResponseSchema.parse(signedOut.json());
    expect(outBody.user).toBeNull();
    expect(outBody.registrationOpen).toBe(true);

    const cookie = cookieOf((await signUp(uniqueEmail())).headers);
    const signedIn = await app.inject({
      method: 'GET',
      url: '/auth/session',
      headers: { cookie },
    });
    const inBody = sessionResponseSchema.parse(signedIn.json());
    expect(inBody.user).not.toBeNull();
    expect(inBody.registrationOpen).toBe(true);
  });
});

describe('registration closed (task 03/03, FR.5.2)', () => {
  let app: NestFastifyApplication;
  let sql: postgres.Sql;
  const existing = uniqueEmail();

  beforeAll(async () => {
    sql = postgres(process.env.DATABASE_URL as string, { max: 2 });
    // Seed one account while the library is reachable directly — the switch is
    // enforced by our use case, not by Better Auth.
    const auth = createAuthInstance(drizzle({ client: sql }));
    await auth.api.signUpEmail({
      body: { email: existing, password, name: 'existing' },
    });

    app = await createApiApp(makeTestEnv({ AUTH_REGISTRATION_OPEN: 'false' }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await sql.end();
    await app.close();
  });

  it('POST sign-up returns REGISTRATION_CLOSED and creates no row, while sign-in on an existing account still succeeds', async () => {
    const fresh = uniqueEmail();
    const blocked = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email: fresh, password },
    });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json()).toMatchObject({ code: 'REGISTRATION_CLOSED' });

    const userRows = await sql<{ n: number }[]>`
      select count(*)::int as n from "user" where email = ${fresh}
    `;
    expect(userRows[0]?.n).toBe(0);

    const signIn = await app.inject({
      method: 'POST',
      url: '/auth/sign-in',
      payload: { email: existing, password },
    });
    expect(signIn.statusCode).toBe(200);
  });

  it('reports registrationOpen:false on GET auth/session', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/session' });
    expect(sessionResponseSchema.parse(res.json()).registrationOpen).toBe(
      false,
    );
  });
});
