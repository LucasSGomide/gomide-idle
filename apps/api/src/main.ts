import 'reflect-metadata';

import type { Logger } from 'pino';

import { createApiApp } from './bootstrap.js';
import { loadEnv } from './config/env.js';
import { ROOT_LOGGER } from './logging/tokens.js';
import { writeLog } from './logging/write.js';

async function bootstrap(): Promise<void> {
  // Validate the environment before anything else — a bad value must stop
  // start-up here, not surface three layers deep (FR.14.1).
  const env = loadEnv(process.env);
  const app = await createApiApp(env);
  await app.listen({ port: env.PORT, host: env.HOST });

  // The one line that says the listener is open. Without it a booting API, a
  // stalled one and a crashed one all look the same in a terminal, because
  // pino-http's autoLogging is off by design (stack-api.md rule 45) and nothing
  // else logs on the happy path. The logger is taken from the container rather
  // than built here, so architecture-api.md rule 48 still holds.
  writeLog(app.get<Logger>(ROOT_LOGGER), 'bootstrap', 'info', 'API listening', {
    host: env.HOST,
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    buildId: env.BUILD_ID,
    logLevel: env.LOG_LEVEL,
  });
}

bootstrap().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
