import { Global, Module, type OnModuleDestroy } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { ENV, type EnvType } from '../../config/env.js';
import { GetSessionUseCase } from './application/get-session.use-case.js';
import { SignInUseCase } from './application/sign-in.use-case.js';
import { SignOutUseCase } from './application/sign-out.use-case.js';
import { SignUpUseCase } from './application/sign-up.use-case.js';
import { AUTH_INSTANCE } from './auth.tokens.js';
import { AuthController } from './entrypoint/auth.controller.js';
import { SessionGuard } from './entrypoint/session.guard.js';
import { SignInRateLimitGuard } from './entrypoint/sign-in-throttle.js';
import { createAuthInstance } from './infrastructure/auth.instance.js';

// The auth module (stack-api.md rule 30: `auth` holds the library and nothing
// else). It owns a small Postgres pool of its own rather than reaching into
// another module's DATABASE provider — auth.md rule 1 keeps every `better-auth`
// dependency, the adapter included, inside this folder, and
// architecture-api.md rule 19's inward-only imports forbid the cross-module
// reach. Sessions still live in the project's one Postgres (stack-api.md
// rule 26); this is a second pool to the same database, not a second store.
//
// @Global so the session guard (registered app-wide) and any gateway can inject
// AUTH_INSTANCE without re-importing this module.
@Global()
@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_INSTANCE,
      inject: [ENV],
      useFactory: (env: EnvType) => {
        // postgres.js connects lazily — no I/O here, so OpenAPI generation
        // (preview mode) and unit tests never touch a database.
        const client = postgres(env.DATABASE_URL, { max: 5 });
        AuthModule.client = client;
        return createAuthInstance(drizzle({ client }));
      },
    },
    SignUpUseCase,
    SignInUseCase,
    SignOutUseCase,
    GetSessionUseCase,
    // FR.5.1: the sign-in rate limit, applied only to POST auth/sign-in via
    // @UseGuards in the controller.
    SignInRateLimitGuard,
    // auth.md rule 12: the session guard is applied globally, not per
    // controller, so the guard missing from next week's controller cannot
    // happen. Public routes opt out with @Public().
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
  exports: [AUTH_INSTANCE, GetSessionUseCase],
})
export class AuthModule implements OnModuleDestroy {
  private static client: ReturnType<typeof postgres> | undefined;

  async onModuleDestroy(): Promise<void> {
    await AuthModule.client?.end();
    AuthModule.client = undefined;
  }
}
