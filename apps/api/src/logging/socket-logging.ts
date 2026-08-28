import { requestStore } from './als.js';

// architecture-api.md rule 44: every inbound message carries a client correlation
// id; fall back to a marker so an error frame still has the field.
export function extractCorrelationId(data: unknown): string {
  if (
    data !== null &&
    typeof data === 'object' &&
    typeof (data as Record<string, unknown>).correlationId === 'string'
  ) {
    return (data as Record<string, unknown>).correlationId as string;
  }
  return 'unknown';
}

// architecture-api.md rule 53: a socket has no per-request hook. The connection's
// identity is fixed at the handshake; each inbound message runs inside a child
// context whose correlation id is that message's own.
export function runWithMessageContext<T>(
  connectionId: string,
  messageCorrelationId: string,
  handler: () => Promise<T>,
): Promise<T> {
  return requestStore.run(
    { correlationId: messageCorrelationId, connectionId },
    handler,
  );
}
