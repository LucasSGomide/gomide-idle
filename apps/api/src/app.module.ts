import { Module, type DynamicModule } from '@nestjs/common';
import type { Logger } from 'pino';

import { ConfigModule } from './config/config.module.js';
import { type EnvType } from './config/env.js';
import { ErrorsModule } from './errors/errors.module.js';
import { LoggingModule } from './logging/logging.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CharacterModule } from './modules/character/character.module.js';
import { HuntModule } from './modules/hunt/hunt.module.js';
import { PlayerModule } from './modules/player/player.module.js';
import { SystemModule } from './modules/system/system.module.js';

export type AppModuleOptionsType = {
  rootLogger: Logger;
  observabilityImports: DynamicModule[];
};

@Module({})
export class AppModule {
  static register(env: EnvType, options: AppModuleOptionsType): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.register(env),
        LoggingModule.register(options.rootLogger),
        ErrorsModule,
        ...options.observabilityImports,
        AuthModule,
        PlayerModule,
        CharacterModule,
        HuntModule,
        SystemModule,
      ],
    };
  }
}
