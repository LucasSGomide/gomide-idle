import { Module } from '@nestjs/common';

import { GetServerMetaUseCase } from './application/get-server-meta.use-case.js';
import { GET_SERVER_META_DAO } from './application/tokens.js';
import { ServerMetaController } from './entrypoint/server-meta.controller.js';
import { GetServerMetaDao } from './infrastructure/database/dao/get-server-meta.dao.js';

// The system module (FR.9.7): what belongs to the running server rather than to
// a game system. Holds the server_meta read path — the server's half of UN.10's
// proof that every layer connects.
@Module({
  controllers: [ServerMetaController],
  providers: [
    GetServerMetaUseCase,
    { provide: GET_SERVER_META_DAO, useClass: GetServerMetaDao },
  ],
})
export class SystemModule {}
