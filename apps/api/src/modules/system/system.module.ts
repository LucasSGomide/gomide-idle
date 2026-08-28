import { Module } from '@nestjs/common';

import { GetServerMetaUseCase } from './application/get-server-meta.use-case.js';
import { GET_SERVER_META_DAO } from './application/tokens.js';
import { ServerMetaController } from './entrypoint/server-meta.controller.js';
import { SystemGateway } from './entrypoint/system.gateway.js';
import { GetServerMetaDao } from './infrastructure/database/dao/get-server-meta.dao.js';

// The system module (FR.9.7): what belongs to the running server rather than to
// a game system. The server_meta read path — reachable over HTTP and over the
// socket through the same use case (architecture-api.md rule 24).
@Module({
  controllers: [ServerMetaController],
  providers: [
    GetServerMetaUseCase,
    SystemGateway,
    { provide: GET_SERVER_META_DAO, useClass: GetServerMetaDao },
  ],
})
export class SystemModule {}
