import { z } from 'zod';

// FR.11.1: the single source for request validation, the OpenAPI document and
// the socket message types. Its explicit name in the OpenAPI document comes from
// the nestjs-zod DTO class (ServerMetaResponse) rather than a schema-level
// .meta({ id }) — a top-level .meta id passed straight to createZodDto collides
// with cleanupOpenApiDoc's own hoist. stack-api.md rule 47 / FR.11.4 is met: the
// component is named ServerMetaResponse, never positional.
export const serverMetaResponseSchema = z.object({
  socketProtocolVersion: z.number().int(),
  contentPackVersion: z.string(),
  buildId: z.string(),
});

// The name the OpenAPI component must carry.
export const SERVER_META_RESPONSE_SCHEMA_ID = 'ServerMetaResponse';

export type ServerMetaResponseType = z.infer<typeof serverMetaResponseSchema>;
