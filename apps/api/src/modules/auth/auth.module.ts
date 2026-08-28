import { Module } from '@nestjs/common';

// The auth module. domain/, application/, infrastructure/ and entrypoint/ layers
// are placed; imports point inward only (architecture-api.md rules 19-24). This
// module holds no code yet.
@Module({})
export class AuthModule {}
