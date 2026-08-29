// stack-web.md rule 22 / FR.10.3: the socket protocol version the client
// speaks, hard-coded here. The handshake in transport/ compares the server's
// against this and refuses to proceed on a mismatch — a stale client has a
// stale constant, which is the point. Bumped in lockstep with libs/contracts'
// SOCKET_PROTOCOL_VERSION on a breaking change to the wire protocol.
export const SOCKET_PROTOCOL_VERSION = 1;
