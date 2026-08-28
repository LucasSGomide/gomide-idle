import { Controller, Get } from '@nestjs/common';

import type { ServerMetaResponseType } from '@gomide/contracts';

import { GetServerMetaUseCase } from '../application/get-server-meta.use-case.js';

// architecture-api.md rule 24: the entrypoint decides nothing. It maps the
// request to the use-case input and the result straight back, so a socket
// handler could call the same use case.
@Controller('server-meta')
export class ServerMetaController {
  constructor(private readonly getServerMeta: GetServerMetaUseCase) {}

  @Get()
  get(): Promise<ServerMetaResponseType> {
    return this.getServerMeta.execute({});
  }
}
