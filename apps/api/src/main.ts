import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.js';

async function bootstrap(): Promise<void> {
  // Validate the environment before anything else — a bad value must stop
  // start-up here, not surface three layers deep (FR.14.1).
  const env = loadEnv(process.env);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register(env),
    // trustProxy on: behind Caddy the client address comes from the forwarded
    // header, so a log line and a rate-limit counter see the real caller
    // rather than the proxy (FR.13.5, stack-api.md rule 49).
    new FastifyAdapter({ trustProxy: true }),
  );

  await app.listen({ port: env.PORT, host: env.HOST });
}

bootstrap().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
