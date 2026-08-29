import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { SOCKET_PROTOCOL_VERSION } from '@/lib/protocol';

import { checkSocketProtocol } from './socket';

const here = dirname(fileURLToPath(import.meta.url));

class FakeSocket extends EventEmitter {
  closed = false;
  close() {
    this.closed = true;
  }
}

describe('checkSocketProtocol', () => {
  // stack-web.md rule 22 / FR.10.3: reads the protocol integer from the
  // handshake and compares it against the one hard-coded in lib/protocol.ts.
  it('returns ok when the server protocol matches', async () => {
    const socket = new FakeSocket();
    const result = checkSocketProtocol(() => socket);
    socket.emit('handshake', { protocolVersion: SOCKET_PROTOCOL_VERSION });
    await expect(result).resolves.toEqual({ status: 'ok' });
    expect(socket.closed).toBe(true);
  });

  it('returns mismatch, with the server protocol, when it differs', async () => {
    const socket = new FakeSocket();
    const result = checkSocketProtocol(() => socket);
    socket.emit('handshake', { protocolVersion: SOCKET_PROTOCOL_VERSION + 1 });
    await expect(result).resolves.toEqual({
      status: 'mismatch',
      serverProtocol: SOCKET_PROTOCOL_VERSION + 1,
    });
  });

  // stack-web.md rule 22 / architecture-web.md rule 32: nothing but the protocol
  // integer is compared, and no content-pack version check runs.
  it('compares nothing but the protocol integer', () => {
    const source = readFileSync(join(here, 'socket.ts'), 'utf8');
    expect(source).not.toMatch(/content.?pack/i);
    // The only same-origin connection: `io()` with no URL argument.
    expect(source).toMatch(/io\(\{ autoConnect: true \}\)/);
    expect(source).not.toMatch(/io\(\s*['"`]https?:/);
  });
});
