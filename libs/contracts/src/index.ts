// libs/contracts is the single source for every payload shape (FR.11.1): request
// validation on the server, the OpenAPI document Orval reads, and the socket
// message types. The schemas themselves land with the read path and the
// handshake (roadmap tasks 05 and 06); this package is placed here first so the
// dependency graph — and the nestjs-zod peer override its test checks — exists.
export {};
