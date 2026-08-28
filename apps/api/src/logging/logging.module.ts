import { Global, Module, type DynamicModule } from '@nestjs/common';
import type { Logger } from 'pino';

import { AppLogger } from './app-logger.js';
import { ROOT_LOGGER } from './tokens.js';

@Global()
@Module({})
export class LoggingModule {
  static register(rootLogger: Logger): DynamicModule {
    return {
      module: LoggingModule,
      providers: [{ provide: ROOT_LOGGER, useValue: rootLogger }, AppLogger],
      exports: [ROOT_LOGGER, AppLogger],
    };
  }
}
