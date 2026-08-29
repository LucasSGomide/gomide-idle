import { Global, Module } from '@nestjs/common';

import { SessionCloseBus } from './session-close.bus.js';

// Cross-cutting realtime plumbing that belongs to no single game module.
// @Global so the auth module's sign-out and the system module's gateway both
// reach SessionCloseBus without importing across a module boundary.
@Global()
@Module({
  providers: [SessionCloseBus],
  exports: [SessionCloseBus],
})
export class RealtimeModule {}
