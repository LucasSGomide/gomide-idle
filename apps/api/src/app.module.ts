import { Module, type DynamicModule } from '@nestjs/common';

import { ConfigModule } from './config/config.module.js';
import { type EnvType } from './config/env.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CharacterModule } from './modules/character/character.module.js';
import { HuntModule } from './modules/hunt/hunt.module.js';
import { PlayerModule } from './modules/player/player.module.js';
import { SystemModule } from './modules/system/system.module.js';

@Module({})
export class AppModule {
  static register(env: EnvType): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.register(env),
        AuthModule,
        PlayerModule,
        CharacterModule,
        HuntModule,
        SystemModule,
      ],
    };
  }
}
