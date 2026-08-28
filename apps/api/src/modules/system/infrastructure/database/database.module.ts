import {
  Global,
  Module,
  type DynamicModule,
  type OnModuleDestroy,
} from '@nestjs/common';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { ENV, type EnvType } from '../../../../config/env.js';
import { DATABASE } from './tokens.js';

export type DrizzleDbType = PostgresJsDatabase;

@Global()
@Module({})
export class DatabaseModule implements OnModuleDestroy {
  private static client: ReturnType<typeof postgres> | undefined;

  static register(): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DATABASE,
          inject: [ENV],
          useFactory: (env: EnvType): DrizzleDbType => {
            // postgres.js connects lazily — no I/O here.
            DatabaseModule.client = postgres(env.DATABASE_URL, { max: 10 });
            return drizzle({ client: DatabaseModule.client });
          },
        },
      ],
      exports: [DATABASE],
    };
  }

  async onModuleDestroy(): Promise<void> {
    await DatabaseModule.client?.end();
    DatabaseModule.client = undefined;
  }
}
