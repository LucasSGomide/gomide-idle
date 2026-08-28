import type { DynamicModule, NestApplicationOptions } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';

import type { EnvType } from '../config/env.js';

// createObserveModule() just returns the module and the bootstrap hook — it opens
// nothing and connects to nothing on its own.
const { ObserveModule, ObserveInstrument } = createObserveModule();

export type ObservabilityWiringType = {
  imports: DynamicModule[];
  instrument?: NestApplicationOptions['instrument'];
};

// stack-api.md rules 43-44 / FR.21.1-21.2, 21.4. Wired from the first commit, but
// the agent activates only when BOTH credentials are present. With them absent
// the ObserveModule is never imported and no `instrument` hook is set, so the
// agent never starts a worker and sends nothing at all. Development and CI leave
// them unset.
export function resolveObservability(env: EnvType): ObservabilityWiringType {
  if (!env.OBSERVE_APP_KEY || !env.OBSERVE_APP_SECRET) {
    return { imports: [] };
  }

  return {
    instrument: ObserveInstrument,
    imports: [
      ObserveModule.forRoot({
        appKey: env.OBSERVE_APP_KEY,
        appSecret: env.OBSERVE_APP_SECRET,
        serviceId: env.OBSERVE_SERVICE_ID,
        ...(env.OBSERVE_ENDPOINT ? { endpoint: env.OBSERVE_ENDPOINT } : {}),
        // Log lines are the logger's job and do not travel through the agent
        // (stack-api.md rule 44, FR.21.4).
        forwardLogs: false,
      }),
    ],
  };
}
