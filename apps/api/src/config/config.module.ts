import { Global, Module, type DynamicModule } from '@nestjs/common';

import { ENV, type EnvType } from './env.js';

// Holds the validated environment (env.ts) as an injectable value under the ENV
// token. Global so any module can inject it without re-importing.
@Global()
@Module({})
export class ConfigModule {
  static register(env: EnvType): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: ENV, useValue: Object.freeze(env) }],
      exports: [ENV],
    };
  }
}
