import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { AppModule } from './app.module.js';
import { type EnvType } from './config/env.js';
import { createRootLogger } from './logging/pino.js';
import { installRequestLogging } from './logging/request-logging.js';
import { resolveObservability } from './observability/observability.js';

type NestAppFactoryType = (
  module: Parameters<typeof NestFactory.create>[0],
  adapter: FastifyAdapter,
  options: Record<string, unknown>,
) => Promise<NestFastifyApplication>;

export type CreateApiAppDepsType = {
  // Seam for tests: lets a spy observe the options (including `instrument`)
  // passed to NestFactory.create without booting a real agent.
  createNestApp?: NestAppFactoryType;
  logDestination?: NodeJS.WritableStream;
};

// Everything main.ts does except listen(), so a test can boot the same wiring.
export async function createApiApp(
  env: EnvType,
  deps: CreateApiAppDepsType = {},
): Promise<NestFastifyApplication> {
  const create: NestAppFactoryType =
    deps.createNestApp ??
    ((module, adapter, options) =>
      NestFactory.create<NestFastifyApplication>(module, adapter, options));

  const rootLogger = createRootLogger(env, deps.logDestination);
  const observability = resolveObservability(env);

  const app = await create(
    AppModule.register(env, {
      rootLogger,
      observabilityImports: observability.imports,
    }),
    // trustProxy on: the client address comes from the forwarded header
    // (FR.13.5, stack-api.md rule 49).
    new FastifyAdapter({ trustProxy: true }),
    {
      logger: false,
      // Let bootstrap errors surface to the caller (main.ts catches and exits)
      // rather than NestFactory calling process.exit itself.
      abortOnError: false,
      ...(observability.instrument
        ? { instrument: observability.instrument }
        : {}),
    },
  );

  installRequestLogging(app.getHttpAdapter().getInstance(), rootLogger);

  return app;
}
