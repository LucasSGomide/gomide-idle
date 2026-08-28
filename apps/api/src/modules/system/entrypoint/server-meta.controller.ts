import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { ServerMetaResponseType } from '@gomide/contracts';

import { GetServerMetaUseCase } from '../application/get-server-meta.use-case.js';
import { ServerMetaResponse } from './dto/server-meta.dto.js';

// architecture-api.md rule 24: the entrypoint decides nothing. It maps the
// request to the use-case input and the result straight back, so a socket
// handler could call the same use case.
@ApiTags('system')
@Controller('server-meta')
export class ServerMetaController {
  constructor(private readonly getServerMeta: GetServerMetaUseCase) {}

  @Get()
  @ApiOkResponse({ type: ServerMetaResponse })
  get(): Promise<ServerMetaResponseType> {
    return this.getServerMeta.execute({});
  }
}
