import 'reflect-metadata';

import { createApiApp } from './bootstrap.js';
import { loadEnv } from './config/env.js';

async function bootstrap(): Promise<void> {
  // Validate the environment before anything else — a bad value must stop
  // start-up here, not surface three layers deep (FR.14.1).
  const env = loadEnv(process.env);
  const app = await createApiApp(env);
  await app.listen({ port: env.PORT, host: env.HOST });
}

bootstrap().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
