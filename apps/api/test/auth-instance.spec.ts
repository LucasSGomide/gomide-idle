import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  authSharedOptions,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  SESSION_EXPIRES_IN_SECONDS,
  SESSION_UPDATE_AGE_SECONDS,
} from '../src/modules/auth/infrastructure/auth.options.js';
import { createAuthInstance } from '../src/modules/auth/infrastructure/auth.instance.js';

// auth.md rules 15-16, 31 / FR.1.2, FR.1.3, FR.1.5, FR.2.2. The instance is
// built once from a lazy postgres.js client — no connection is opened here.
const client = postgres('postgres://unit:unit@127.0.0.1:5432/unit', { max: 1 });
const auth = createAuthInstance(drizzle({ client }));

afterAll(async () => {
  await client.end();
});

describe('the Better Auth instance', () => {
  it('enables e-mail and password with the 8-128 bound pinned', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(MAX_PASSWORD_LENGTH).toBe(128);
    expect(auth.options.emailAndPassword).toMatchObject({
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    });
  });

  it('registers no mail sender of any kind', () => {
    const options = auth.options as Record<string, unknown>;
    const emailAndPassword = options.emailAndPassword as Record<
      string,
      unknown
    >;
    expect('sendResetPassword' in emailAndPassword).toBe(false);
    expect(options.emailVerification).toBeUndefined();
    expect(authSharedOptions).not.toHaveProperty('emailVerification');
  });

  it('has e-mail verification and password reset both off', () => {
    expect(auth.options.emailAndPassword).toMatchObject({
      requireEmailVerification: false,
    });
    // No reset flow is wired, so no reset route exists (auth.md rule 15).
    const emailAndPassword = auth.options.emailAndPassword as Record<
      string,
      unknown
    >;
    expect(emailAndPassword.sendResetPassword).toBeUndefined();
  });

  it('runs a 30-day session whose refresh window slides the expiry on activity', () => {
    expect(SESSION_EXPIRES_IN_SECONDS).toBe(60 * 60 * 24 * 30);
    expect(auth.options.session).toMatchObject({
      expiresIn: 60 * 60 * 24 * 30,
    });
    // updateAge > 0 and < expiresIn is what makes the session sliding rather
    // than fixed: once older than updateAge it is extended back to expiresIn.
    expect(SESSION_UPDATE_AGE_SECONDS).toBeGreaterThan(0);
    expect(SESSION_UPDATE_AGE_SECONDS).toBeLessThan(SESSION_EXPIRES_IN_SECONDS);
    expect(auth.options.session?.updateAge).toBe(SESSION_UPDATE_AGE_SECONDS);
  });

  it('exposes the four server-side operations the controllers call', () => {
    expect(typeof auth.api.signUpEmail).toBe('function');
    expect(typeof auth.api.signInEmail).toBe('function');
    expect(typeof auth.api.signOut).toBe('function');
    expect(typeof auth.api.getSession).toBe('function');
  });
});
