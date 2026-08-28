import { z } from 'zod';

// FR.11.1: the single source for request validation, the OpenAPI document and
// the socket message types. .meta({ id }) gives it an explicit name, so no
// generated type is named after its position (stack-api.md rule 47, FR.11.4).
export const serverMetaResponseSchema = z
  .object({
    socketProtocolVersion: z.number().int(),
    contentPackVersion: z.string(),
    buildId: z.string(),
  })
  .meta({ id: 'ServerMetaResponse' });

export type ServerMetaResponseType = z.infer<typeof serverMetaResponseSchema>;
