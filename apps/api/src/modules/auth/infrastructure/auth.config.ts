import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { authSharedOptions } from './auth.options.js';

// CLI-only entry point. `make api-auth-schema` (auth.md rule 5) points
// `better-auth generate` at this file; nothing in the running app imports it.
// Schema generation reads the option shape, never the database, so the handle
// here is a lazy postgres.js client that never has to connect and the adapter
// carries no `schema` mapping.
const client = postgres(
  process.env.DATABASE_URL ?? 'postgres://schema-generation:5432/unused',
  { max: 1 },
);

export const auth = betterAuth({
  database: drizzleAdapter(drizzle({ client }), { provider: 'pg' }),
  ...authSharedOptions,
});
