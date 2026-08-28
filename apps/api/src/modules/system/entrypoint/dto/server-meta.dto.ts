import { createZodDto } from 'nestjs-zod';

import { serverMetaResponseSchema } from '@gomide/contracts';

// nestjs-zod bridges the libs/contracts schema into a class @nestjs/swagger
// understands. cleanupOpenApiDoc later renames the component to the schema's
// explicit .meta({ id }) — 'ServerMetaResponse' — so no generated type is named
// after its position (stack-api.md rule 47, FR.11.4).
export class ServerMetaResponse extends createZodDto(
  serverMetaResponseSchema,
) {}
