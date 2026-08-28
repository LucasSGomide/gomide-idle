import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestStoreType = {
  correlationId: string;
};

// One store per in-flight request. Populated in Fastify's onRequest hook
// (architecture-api.md rule 52) and read wherever a log line is written, so the
// correlation id follows a request without being threaded through every
// signature.
export const requestStore = new AsyncLocalStorage<RequestStoreType>();
