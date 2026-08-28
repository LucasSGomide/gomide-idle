import { Module } from '@nestjs/common';

// The system module (FR.9.7): what belongs to the running server rather than to
// a game system. The server_meta read path (task 05) and the health check
// (FR.19.2) live here. Wiring arrives with those; the layers are placed now.
@Module({})
export class SystemModule {}
