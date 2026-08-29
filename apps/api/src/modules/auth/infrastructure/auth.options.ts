import type { BetterAuthOptions } from 'better-auth';

// The Better Auth options that do not depend on a database handle. Split into
// their own file so both the runtime instance (auth.instance.ts) and the
// schema-generation config the CLI reads (auth.config.ts) share one copy — a
// second copy is a second thing to keep in step with the generated schema.
//
// auth.md rule 15: no mail sender of any kind. `sendResetPassword` and
// `sendVerificationEmail` are deliberately absent, which is what makes password
// reset and e-mail verification unreachable rather than unwired (FR.1.2, FR.1.5).
// auth.md rule 31: 30 days, sliding — never Better Auth's 7-day default. FR.1.3:
// the 8–128 bound is pinned rather than left to coincide with the current
// default.

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;
const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const SESSION_EXPIRES_IN_SECONDS = THIRTY_DAYS_IN_SECONDS;
// The refresh window: once a session is older than this it is extended back to
// the full 30 days on the next authenticated request (auth.md rule 31).
export const SESSION_UPDATE_AGE_SECONDS = ONE_DAY_IN_SECONDS;

export const authSharedOptions = {
  // No phone-home from a server this project runs (stack-api.md rule 43 keeps
  // the one hosted collector opt-in and credentialed); Better Auth's own
  // telemetry is off.
  telemetry: { enabled: false },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
    // FR.1.1: sign-up signs the player straight in.
    autoSignIn: true,
    // FR.1.2: the address is an identifier, never confirmed.
    requireEmailVerification: false,
  },
  session: {
    expiresIn: SESSION_EXPIRES_IN_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
} satisfies Omit<BetterAuthOptions, 'database'>;
