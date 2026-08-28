import { loadEnv } from '../src/config/env.js';
import { runMigrations } from '../src/modules/system/infrastructure/database/migrate.js';

// stack-api.md rule 50: migrations run as their own step, never on boot.
const env = loadEnv(process.env);
await runMigrations(env.DATABASE_URL);
process.stdout.write('migrations applied\n');
