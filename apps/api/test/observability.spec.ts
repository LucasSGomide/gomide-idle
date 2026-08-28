import {
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { createApiApp } from '../src/bootstrap.js';
import { loadEnv } from '../src/config/env.js';
import { resolveObservability } from '../src/observability/observability.js';

const envWithout = () => loadEnv({ NODE_ENV: 'test' });
const envWith = () =>
  loadEnv({ NODE_ENV: 'test', OBSERVE_APP_KEY: 'ak', OBSERVE_APP_SECRET: 'as' });

describe('observability wiring (FR.21.1-21.2)', () => {
  it('with the credentials absent, boots and wires no agent', async () => {
    const wiring = resolveObservability(envWithout());
    expect(wiring.instrument).toBeUndefined();
    expect(wiring.imports).toHaveLength(0);

    const app: NestFastifyApplication = await createApiApp(envWithout());
    try {
      await app.init();
      // Start-up succeeded. The agent's options provider is not in the
      // container, so nothing is collecting or sending.
      let observeOptions: unknown;
      try {
        observeOptions = app.get('OBSERVE_OPTIONS', { strict: false });
      } catch {
        observeOptions = undefined;
      }
      expect(observeOptions).toBeUndefined();
    } finally {
      await app.close();
    }
  });

  it('with both credentials present, registers the agent through the instrument bootstrap option', async () => {
    const wiring = resolveObservability(envWith());
    expect(wiring.instrument).toBeDefined();
    expect(wiring.imports).toHaveLength(1);

    let capturedOptions: Record<string, unknown> | undefined;
    const stubApp = {
      getHttpAdapter: () => ({ getInstance: () => ({ addHook: () => undefined }) }),
    } as unknown as NestFastifyApplication;

    await createApiApp(envWith(), {
      createNestApp: async (_module, _adapter, options) => {
        capturedOptions = options;
        return stubApp;
      },
    });

    expect(capturedOptions?.instrument).toBe(wiring.instrument);
  });
});
