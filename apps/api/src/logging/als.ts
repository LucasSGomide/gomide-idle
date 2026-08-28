import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestStoreType = {
  correlationId: string;
  // Set only for socket message handling (architecture-api.md rule 53): the
  // connection's identity, which carries across every message the connection
  // sends while each message keeps its own correlation id.
  connectionId?: string;
};

export const requestStore = new AsyncLocalStorage<RequestStoreType>();
