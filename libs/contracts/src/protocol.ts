// stack-api.md rule 15: the socket protocol version is an integer the client
// hard-codes. Bumped only on a breaking change to the wire protocol; a stale
// client refuses to connect rather than rendering nonsense (FR.10.3). The first
// migration seeds this same value into server_meta.socket_protocol_version.
export const SOCKET_PROTOCOL_VERSION = 1;
