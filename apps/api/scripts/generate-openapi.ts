import 'reflect-metadata';

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import { AppModule } from '../src/app.module.js';
import { loadEnv } from '../src/config/env.js';
import { createRootLogger } from '../src/logging/pino.js';

const outFile =
  process.env.OPENAPI_OUT ??
  join(dirname(fileURLToPath(import.meta.url)), '..', 'openapi.json');

// stack-api.md rule 46 / FR.11.2: boot with preview:true. NestFactory.create
// runs no init in preview mode, so no database pool connects and no port opens,
// while SwaggerModule.createDocument still reads route metadata off the
// controller prototypes. DATABASE_URL is a placeholder that is never read.
const env = loadEnv({
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://unused-in-preview:5432/db',
});

const app = await NestFactory.create(
  AppModule.register(env, {
    rootLogger: createRootLogger({ LOG_LEVEL: 'silent' }),
    observabilityImports: [],
  }),
  new FastifyAdapter(),
  { preview: true, logger: false },
);

const config = new DocumentBuilder()
  .setTitle('Tormented Path API')
  .setVersion('0.1.0')
  .build();

const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
writeFileSync(outFile, `${JSON.stringify(document, null, 2)}\n`);
await app.close();

process.stdout.write(`wrote ${outFile}\n`);
process.exit(0);
