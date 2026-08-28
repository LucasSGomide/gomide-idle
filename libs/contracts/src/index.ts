// libs/contracts is the single source for every payload shape (FR.11.1): request
// validation on the server, the OpenAPI document Orval reads, and the socket
// message types. The response and handshake schemas land with the read path and
// the handshake (roadmap tasks 05 and 06).
export * from './errors.js';
export * from './protocol.js';
export * from './server-meta.schema.js';
