import { z } from 'zod';

// architecture-api.md rule 44: every inbound socket message carries a
// client-generated correlation id, echoed on the reply. FR.11.1 / FR.11.4:
// libs/contracts is the source, .meta({ id }) names each schema.
export const socketInboundEnvelopeSchema = z
  .object({
    correlationId: z.string().min(1),
  })
  .meta({ id: 'SocketInboundEnvelope' });

export type SocketInboundEnvelopeType = z.infer<
  typeof socketInboundEnvelopeSchema
>;

// The handshake payload the client sends. Unauthenticated for now (decided
// 2026-08-28): no session, no credential.
export const socketHandshakeSchema = socketInboundEnvelopeSchema
  .extend({
    protocolVersion: z.number().int(),
  })
  .meta({ id: 'SocketHandshake' });

export type SocketHandshakeType = z.infer<typeof socketHandshakeSchema>;

// architecture-api.md rule 45: the socket error frame is rule 37's HTTP body
// minus its status code, plus the correlation id — same `code` vocabulary as
// HTTP so the web renders it with the same code path.
export const socketErrorFrameSchema = z
  .object({
    correlationId: z.string(),
    code: z.string(),
    message: z.string(),
    children: z.array(z.unknown()).optional(),
  })
  .meta({ id: 'SocketErrorFrame' });

export type SocketErrorFrameType = z.infer<typeof socketErrorFrameSchema>;
