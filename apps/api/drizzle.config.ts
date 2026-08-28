import { defineConfig } from 'drizzle-kit';

// stack-api.md rule 17: drizzle-kit owns every migration in the repo. v1's
// timestamped migration folders are the format a greenfield repo starts on.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/modules/system/infrastructure/database/schema/*.schema.ts',
  out: './migrations',
});
