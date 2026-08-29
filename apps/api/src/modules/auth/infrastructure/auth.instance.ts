import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { authSharedOptions } from './auth.options.js';
import * as authSchema from './database/schema/index.js';

// auth.md rule 2: the Better Auth instance is an adapter, built in the auth
// module's infrastructure/. auth.md rule 1: every `better-auth` import stays in
// this folder — an upgrade or a swap is one directory, not a grep.
//
// stack-api.md rules 26-27: the Drizzle adapter over this project's own
// Postgres, so revoking a session is a DELETE. The generated schema is handed to
// the adapter so its queries hit the real tables.
export function createAuthInstance(db: PostgresJsDatabase) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
    ...authSharedOptions,
  });
}

// The instance keeps Better Auth's narrow generic (its `.api` surface is typed
// against the options above), so the token consumers get `auth.api.signInEmail`
// checked rather than `any`.
export type AuthInstanceType = ReturnType<typeof createAuthInstance>;
