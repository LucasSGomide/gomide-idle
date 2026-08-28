import { Inject, Injectable } from '@nestjs/common';

import type { ServerMetaResponseType } from '@gomide/contracts';

import { ENV, type EnvType } from '../../../config/env.js';
import type { GetServerMetaDaoPort } from './get-server-meta.dao.port.js';
import type { GetServerMetaInputType } from './get-server-meta.input.type.js';
import { resolveBuildId } from './resolve-build-id.js';
import { GET_SERVER_META_DAO } from './tokens.js';

// naming.md rule 1: <verb>-<resource>.use-case.ts exporting <Verb><Resource>UseCase.
// architecture-api.md rule 25: one public execute taking one typed input. It
// depends on the port (GET_SERVER_META_DAO), never on the DAO implementation.
@Injectable()
export class GetServerMetaUseCase {
  constructor(
    @Inject(GET_SERVER_META_DAO)
    private readonly serverMetaDao: GetServerMetaDaoPort,
    @Inject(ENV) private readonly env: EnvType,
  ) {}

  async execute(
    _input: GetServerMetaInputType,
  ): Promise<ServerMetaResponseType> {
    const row = await this.serverMetaDao.getServerMeta();
    return {
      socketProtocolVersion: row.socketProtocolVersion,
      contentPackVersion: row.contentPackVersion,
      // The reported build id is the running build's, not the seeded placeholder.
      buildId: resolveBuildId(this.env.BUILD_ID, row.buildId),
    };
  }
}
