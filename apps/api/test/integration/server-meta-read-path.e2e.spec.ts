import { type NestFastifyApplication } from '@nestjs/platform-fastify';

import { serverMetaResponseSchema } from '@gomide/contracts';

import { createApiApp } from '../../src/bootstrap.js';
import { makeTestEnv } from '../support/env.js';

// UN.10 / FR.10.1: one path end to end — an HTTP endpoint reading a seeded
// server_meta row from real Postgres through Drizzle. globalSetup seeded the
// container's default schema, which is what the app connects to.
describe('GET /server-meta (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApiApp(makeTestEnv({ BUILD_ID: 'e2e-build-42' }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  afterAll(async () => {
    await app.close();
  });

  it('returns the seeded values, validating against the libs/contracts schema', async () => {
    const res = await app.inject({ method: 'GET', url: '/server-meta' });
    expect(res.statusCode).toBe(200);

    const body = serverMetaResponseSchema.parse(res.json());
    expect(body.socketProtocolVersion).toBe(1);
    expect(body.contentPackVersion).toBe('0.1.0');
    // resolveBuildId overlays the running build's id over the seeded placeholder
    expect(body.buildId).toBe('e2e-build-42');
  });
});
