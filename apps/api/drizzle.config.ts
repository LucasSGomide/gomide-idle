import { defineConfig } from 'drizzle-kit';

// stack-api.md rule 17: drizzle-kit owns every migration in the repo. v1's
// timestamped migration folders are the format a greenfield repo starts on.
export default defineConfig({
  dialect: 'postgresql',
  // Every module keeps its Drizzle tables in infrastructure/database/schema/.
  // The auth module's file there is Better Auth's generated output (auth.md
  // rule 5); drizzle-kit diffs and applies it alongside the game tables.
  schema: './src/modules/*/infrastructure/database/schema/*.schema.ts',
  out: './migrations',
});
