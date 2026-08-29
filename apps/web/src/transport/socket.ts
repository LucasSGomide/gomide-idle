import { io } from 'socket.io-client';

import { SOCKET_PROTOCOL_VERSION } from '@/lib/protocol';

// architecture-web.md rule 12: this is the only file that imports the socket
// library. FR.14.3: `io()` with no URL connects same-origin over a relative
// path, so nothing about the host is compiled into the client.

export type ProtocolCheckResult =
  { status: 'ok' } | { status: 'mismatch'; serverProtocol: number };

// Just the surface checkSocketProtocol touches — a real Socket satisfies it, and
// a test's fake only has to provide these two.
type HandshakePayload = { protocolVersion: number };
type MinimalSocket = {
  on(
    event: 'handshake',
    listener: (payload: HandshakePayload) => void,
  ): unknown;
  close(): unknown;
};

// stack-web.md rule 22 / FR.10.3: connect to 01's unauthenticated handshake,
// read the protocol integer it carries, and compare it against the one
// hard-coded in lib/protocol.ts — nothing else. On a mismatch the client
// refuses to proceed (the caller renders the out-of-date screen).
//
// `createSocket` is injectable so a test hands in a fake — MSW cannot intercept
// Socket.IO (architecture-web.md rule 19).
export function checkSocketProtocol(
  createSocket: () => MinimalSocket = () => io({ autoConnect: true }),
): Promise<ProtocolCheckResult> {
  return new Promise((resolve) => {
    const socket = createSocket();
    socket.on('handshake', (payload: HandshakePayload) => {
      const serverProtocol = payload.protocolVersion;
      socket.close();
      resolve(
        serverProtocol === SOCKET_PROTOCOL_VERSION
          ? { status: 'ok' }
          : { status: 'mismatch', serverProtocol },
      );
    });
  });
}
